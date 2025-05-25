// Local Drowsiness Detection Module using face-api.js
// This module handles browser-based drowsiness detection when the Python backend is unavailable

// State
let isInitialized = false;
let isDetecting = false;
let faceApiLoaded = false;
let lastPrediction = {
  isDrowsy: false,
  confidence: 0,
  ear: 0.3,
  blinkCount: 0,
  faceDetected: false,
  timestamp: 0
};

// Drowsiness detection parameters
const EAR_THRESHOLD = 0.2;  // Eye Aspect Ratio threshold for drowsiness
const CONSECUTIVE_FRAMES = 10;  // Number of consecutive frames to detect drowsiness
const BLINK_THRESHOLD = 0.21;  // Threshold for detecting blinks
const BLINK_CONSECUTIVE_FRAMES = 3;  // Consecutive frames for a valid blink

// Buffer of EAR values for smoothing and drowsiness detection
let earBuffer = [];
let blinkCounter = 0;
let closedEyeFrames = 0;
let lastBlinkTimestamp = 0;
let previousEyeState = 'open';

/**
 * Initialize the local detector
 * 
 * @param {Object} config Configuration options
 * @returns {Promise<boolean>} True if initialization was successful
 */
async function initialize(config = {}) {
  try {
    console.log('Initializing local drowsiness detection using face-api.js...');
    
    // Check if face-api.js is available
    if (typeof faceapi === 'undefined') {
      await loadFaceApi();
    }
    
    // Monkey patch the environment for face-api.js
    faceapi.env.monkeyPatch({
      Canvas: HTMLCanvasElement,
      Image: HTMLImageElement,
      ImageData: ImageData,
      Video: HTMLVideoElement,
      createCanvasElement: () => document.createElement('canvas'),
      createImageElement: () => document.createElement('img')
    });
    
    // Load face-api models if not already loaded
    if (!faceApiLoaded) {
      try {
        // Load only the models we need for drowsiness detection
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models/face-api'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api')
        ]);
        
        faceApiLoaded = true;
        console.log('Face-API models loaded successfully for drowsiness detection');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        throw new Error('Failed to load face detection models');
      }
    }
    
    // Reset detection state
    resetDetector();
    
    isInitialized = true;
    console.log('Local drowsiness detection initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize local detector:', error);
    isInitialized = false;
    throw error;
  }
}

/**
 * Load face-api.js dynamically if not available
 */
async function loadFaceApi() {
  return new Promise((resolve, reject) => {
    try {
      // Check if already loaded
      if (typeof faceapi !== 'undefined') {
        faceApiLoaded = true;
        return resolve();
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
      script.async = true;
      script.onload = () => {
        faceApiLoaded = true;
        console.log('face-api.js loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load face-api.js:', error);
        reject(new Error('Failed to load face-api.js'));
      };
      document.body.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calculate Eye Aspect Ratio (EAR) from eye landmarks
 * 
 * @param {Array} landmarks FaceLandmarks68 landmarks from face-api.js
 * @returns {number} Average Eye Aspect Ratio
 */
function calculateEAR(landmarks) {
  try {
    // Get eye landmarks (each eye has 6 points in landmarks)
    const leftEye = [
      landmarks.getLeftEye()[0],
      landmarks.getLeftEye()[1],
      landmarks.getLeftEye()[2],
      landmarks.getLeftEye()[3],
      landmarks.getLeftEye()[4],
      landmarks.getLeftEye()[5]
    ];
    
    const rightEye = [
      landmarks.getRightEye()[0],
      landmarks.getRightEye()[1],
      landmarks.getRightEye()[2],
      landmarks.getRightEye()[3],
      landmarks.getRightEye()[4],
      landmarks.getRightEye()[5]
    ];
    
    // Calculate EAR for left eye
    const leftEAR = calculateEyeAspectRatio(leftEye);
    
    // Calculate EAR for right eye
    const rightEAR = calculateEyeAspectRatio(rightEye);
    
    // Return average EAR
    return (leftEAR + rightEAR) / 2.0;
  } catch (error) {
    console.error('Error calculating EAR:', error);
    return 0.3; // Default open eye value
  }
}

/**
 * Calculate Eye Aspect Ratio for a single eye
 * 
 * @param {Array} eye Array of eye landmark points
 * @returns {number} Eye Aspect Ratio
 */
function calculateEyeAspectRatio(eye) {
  try {
    // Vertical eye landmarks
    // Points are arranged as:
    // 0: left corner, 1: top left, 2: top right, 3: right corner, 4: bottom right, 5: bottom left
    
    // Calculate the euclidean distance between vertical landmarks
    const v1 = distance(eye[1], eye[5]); // top to bottom at left side
    const v2 = distance(eye[2], eye[4]); // top to bottom at right side
    
    // Calculate the euclidean distance between horizontal landmarks
    const h = distance(eye[0], eye[3]); // left to right corners
    
    // Return the EAR
    if (h === 0) return 0.3; // Avoid division by zero
    return (v1 + v2) / (2.0 * h);
  } catch (error) {
    console.error('Error calculating single eye EAR:', error);
    return 0.3;
  }
}

/**
 * Calculate Euclidean distance between two points
 * 
 * @param {Object} point1 First point with x, y coordinates
 * @param {Object} point2 Second point with x, y coordinates
 * @returns {number} Distance between points
 */
function distance(point1, point2) {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + 
    Math.pow(point2.y - point1.y, 2)
  );
}

/**
 * Process a video frame for drowsiness detection
 * 
 * @param {HTMLVideoElement} videoElement The video element to process
 * @param {Function} onDrowsinessChange Callback for drowsiness status changes
 * @returns {Promise<Object>} Detection result
 */
async function processFrame(videoElement, onDrowsinessChange = null) {
  if (!isInitialized || isDetecting || !videoElement) {
    return lastPrediction;
  }
  
  try {
    isDetecting = true;
    
    // Ensure video is playing and has dimensions
    if (videoElement.paused || videoElement.ended || !videoElement.videoWidth) {
      return lastPrediction;
    }
    
    // Detect face with landmarks
    const options = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 224, 
      scoreThreshold: 0.5 
    });
    
    const detection = await faceapi
      .detectSingleFace(videoElement, options)
      .withFaceLandmarks();
    
    if (!detection) {
      // No face detected
      const noFaceResult = {
        isDrowsy: false,
        confidence: 0,
        ear: 0.3,
        blinkCount: lastPrediction.blinkCount,
        faceDetected: false,
        timestamp: Date.now()
      };
      
      // Only update if several consecutive no-face frames
      if (earBuffer.length === 0) {
        lastPrediction = noFaceResult;
        if (onDrowsinessChange) {
          onDrowsinessChange(noFaceResult);
        }
      }
      
      return noFaceResult;
    }
    
    // Calculate EAR
    const ear = calculateEAR(detection.landmarks);
    
    // Add to buffer for smoother detection
    earBuffer.push(ear);
    if (earBuffer.length > CONSECUTIVE_FRAMES) {
      earBuffer.shift();
    }
    
    // Calculate moving average of EAR
    const avgEAR = earBuffer.reduce((a, b) => a + b, 0) / earBuffer.length;
    
    // Update eye state (open/closed)
    const currentEyeState = avgEAR < BLINK_THRESHOLD ? 'closed' : 'open';
    
    // Blink detection logic
    let blinkDetected = false;
    
    if (previousEyeState === 'open' && currentEyeState === 'closed') {
      // Start of eye closure, reset frame counter
      closedEyeFrames = 1;
    } else if (currentEyeState === 'closed') {
      // Continuing eye closure
      closedEyeFrames++;
    } else if (previousEyeState === 'closed' && currentEyeState === 'open') {
      // End of eye closure - check if it was a blink
      const now = Date.now();
      if (closedEyeFrames >= BLINK_CONSECUTIVE_FRAMES && 
          closedEyeFrames <= 7 && // Not too long for a blink
          now - lastBlinkTimestamp > 500) { // Not too frequent
        blinkDetected = true;
        blinkCounter++;
        lastBlinkTimestamp = now;
      }
      closedEyeFrames = 0;
    }
    
    previousEyeState = currentEyeState;
    
    // Determine drowsiness - if eyes closed for too many consecutive frames
    const isDrowsy = avgEAR < EAR_THRESHOLD;
    
    // Calculate confidence value (0-1)
    let confidence = 0;
    if (isDrowsy) {
      // Higher confidence the longer eyes are closed
      confidence = Math.min(0.4 + (closedEyeFrames / CONSECUTIVE_FRAMES) * 0.6, 1.0);
    }
    
    // Create result object
    const prediction = {
      isDrowsy,
      confidence,
      ear: avgEAR,
      blinkCount: blinkCounter,
      faceDetected: true,
      headPose: null, // Not implemented in this simplified version
      timestamp: Date.now()
    };
    
    // Check if drowsiness state changed
    const stateChanged = prediction.isDrowsy !== lastPrediction.isDrowsy;
    
    // Update last prediction
    lastPrediction = prediction;
    
    // Notify about drowsiness change if callback is provided and state changed
    if ((stateChanged || blinkDetected) && onDrowsinessChange) {
      onDrowsinessChange(lastPrediction);
    }
    
    return lastPrediction;
  } catch (error) {
    console.error('Error processing frame with local detection:', error);
    return lastPrediction;
  } finally {
    isDetecting = false;
  }
}

/**
 * Reset the detector state
 */
function resetDetector() {
  lastPrediction = {
    isDrowsy: false,
    confidence: 0,
    ear: 0.3,
    blinkCount: 0,
    faceDetected: false,
    timestamp: 0
  };
  earBuffer = [];
  blinkCounter = 0;
  closedEyeFrames = 0;
  lastBlinkTimestamp = 0;
  previousEyeState = 'open';
}

/**
 * Check if the detector is ready
 * 
 * @returns {boolean} True if the detector is ready
 */
function isReady() {
  return isInitialized && faceApiLoaded;
}

// Export the module
export default {
  initialize,
  processFrame,
  resetDetector,
  isReady
}; 