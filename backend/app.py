from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import time
import random
import cv2
import numpy as np
import threading
import logging
import tensorflow as tf
import tensorflow_hub as hub
from PIL import Image
import io
import base64

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables
is_detection_running = False
detection_thread = None
camera = None
last_frame = None
frame_lock = threading.Lock()
phone_detection_model = None

# Simulated drowsiness data
drowsiness_data = {
    "is_drowsy": False,
    "confidence": 0.0,
    "eye_aspect_ratio": 0.0,
    "yawn_count": 0,
    "blink_count": 0,
    "timestamp": 0
}

# Load the phone detection model
def load_phone_detection_model():
    global phone_detection_model
    try:
        logger.info("Loading phone detection model...")
        model_handle = "https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2"
        phone_detection_model = hub.load(model_handle)
        logger.info("Phone detection model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Error loading phone detection model: {e}")
        return False

def process_image_for_phone_detection(image_data):
    try:
        # Remove header if exists
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_data)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize image to a reasonable size for detection
        image = image.resize((640, 480))
        
        # Convert to numpy array and expand dimensions
        image_np = np.array(image)
        input_tensor = tf.convert_to_tensor(image_np)
        input_tensor = input_tensor[tf.newaxis, ...]
        
        return input_tensor
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return None

def detect_phone(image_tensor):
    try:
        if phone_detection_model is None:
            if not load_phone_detection_model():
                return {"error": "Model not loaded"}
        
        # Run detection
        detections = phone_detection_model(image_tensor)
        
        # Process results
        boxes = detections['detection_boxes'][0].numpy()
        classes = detections['detection_classes'][0].numpy()
        scores = detections['detection_scores'][0].numpy()
        
        # Filter for phones (class 77 in COCO dataset is 'cell phone')
        phone_detections = []
        for i in range(len(scores)):
            if scores[i] >= 0.5 and classes[i] == 77:  # threshold of 0.5 confidence
                phone_detections.append({
                    "bbox": boxes[i].tolist(),
                    "score": float(scores[i]),
                    "class": "cell phone"
                })
        
        return {
            "detections": phone_detections,
            "timestamp": int(time.time() * 1000)
        }
    except Exception as e:
        logger.error(f"Error in phone detection: {e}")
        return {"error": str(e)}

def generate_frames():
    """Generate video frames for streaming"""
    global camera, last_frame, frame_lock
    
    if camera is None:
        try:
            camera = cv2.VideoCapture(0)
            if not camera.isOpened():
                logger.error("Failed to open camera")
                return
        except Exception as e:
            logger.error(f"Error opening camera: {e}")
            return
    
    while True:
        with frame_lock:
            if last_frame is None:
                ret, frame = camera.read()
                if not ret:
                    logger.error("Failed to read from camera")
                    time.sleep(0.1)
                    continue
                last_frame = frame
            else:
                frame = last_frame.copy()
        
        # Add some visual indicators
        cv2.putText(frame, "Drowsiness Detection Active", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Convert to JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        
        # Yield the frame
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        
        # Small delay to control frame rate
        time.sleep(0.03)

def simulate_drowsiness_detection():
    """Simulate drowsiness detection in a separate thread"""
    global is_detection_running, drowsiness_data
    
    while is_detection_running:
        # Simulate drowsiness detection
        is_drowsy = random.random() < 0.2  # 20% chance of being drowsy
        confidence = random.uniform(0.7, 0.95)
        eye_aspect_ratio = random.uniform(0.2, 0.3)
        yawn_count = random.randint(0, 5)
        blink_count = random.randint(10, 30)
        
        # Update drowsiness data
        drowsiness_data.update({
            "is_drowsy": is_drowsy,
            "confidence": confidence,
            "eye_aspect_ratio": eye_aspect_ratio,
            "yawn_count": yawn_count,
            "blink_count": blink_count,
            "timestamp": int(time.time() * 1000)
        })
        
        # Sleep for a short time
        time.sleep(0.5)

@app.route('/status')
def status():
    """Check if the server is online"""
    return jsonify({"status": "online", "message": "Server is running"})

@app.route('/api/status')
def api_status():
    """Check if the API is online"""
    return jsonify({"status": "online", "message": "API is running"})

@app.route('/api/start-drowsiness-detection')
def start_detection():
    """Start drowsiness detection"""
    global is_detection_running, detection_thread
    
    if is_detection_running:
        return jsonify({"success": False, "message": "Detection already running"})
    
    try:
        is_detection_running = True
        detection_thread = threading.Thread(target=simulate_drowsiness_detection)
        detection_thread.daemon = True
        detection_thread.start()
        
        return jsonify({"success": True, "message": "Drowsiness detection started"})
    except Exception as e:
        logger.error(f"Error starting detection: {e}")
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/stop-drowsiness-detection')
def stop_detection():
    """Stop drowsiness detection"""
    global is_detection_running, camera
    
    is_detection_running = False
    
    # Release camera if it's open
    if camera is not None:
        camera.release()
    
    return jsonify({"success": True, "message": "Drowsiness detection stopped"})

@app.route('/api/drowsiness-data')
def get_drowsiness_data():
    """Get current drowsiness data"""
    return jsonify(drowsiness_data)

@app.route('/video_feed')
def video_feed():
    """Stream video feed"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/detect-phone', methods=['POST'])
def detect_phone_endpoint():
    """Endpoint for phone detection in images"""
    try:
        data = request.get_json()
        if not data or 'imageData' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        image_tensor = process_image_for_phone_detection(data['imageData'])
        if image_tensor is None:
            return jsonify({"error": "Failed to process image"}), 400
        
        result = detect_phone(image_tensor)
        if "error" in result:
            return jsonify(result), 500
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in phone detection endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/phone-detection-status')
def phone_detection_status():
    """Check if phone detection model is loaded"""
    return jsonify({
        "status": "ok",
        "modelLoaded": phone_detection_model is not None
    })

@app.route('/api/health')
def health_check():
    """Check if the server and model are healthy"""
    return jsonify({
        "status": "ok",
        "modelLoaded": phone_detection_model is not None
    })

if __name__ == '__main__':
    logger.info("Starting drowsiness detection server...")
    load_phone_detection_model()  # Load model at startup
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True) 