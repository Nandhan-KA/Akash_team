// Backend Drowsiness Detection Module
// This module handles communication with the Python backend for drowsiness detection

// State
let apiUrl = '';
let isInitialized = false;
let isDetecting = false;
let lastPrediction = {
  isDrowsy: false,
  confidence: 0,
  timestamp: 0
};
let errorCount = 0;
const MAX_ERRORS = 5;

// Cache for predicted frames
let frameCache = null;

/**
 * Initialize the backend detector
 * 
 * @param {string} backendUrl URL of the drowsiness detection API
 * @returns {Promise<boolean>} True if initialization was successful
 */
async function initialize(backendUrl) {
  try {
    apiUrl = backendUrl;
    
    // Test the connection to the backend with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`${apiUrl}/detect/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'online') {
        throw new Error('Backend is not ready');
      }
      
      isInitialized = true;
      console.log('Backend drowsiness detection initialized successfully');
      return true;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Connection to backend timed out');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Failed to initialize backend detector:', error);
    isInitialized = false;
    throw error;
  }
}

/**
 * Capture and convert a frame from video element to base64
 * 
 * @param {HTMLVideoElement} videoElement The video element to capture
 * @returns {string|null} Base64 encoded image or null if failed
 */
function captureFrame(videoElement) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Convert to JPEG base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Extract base64 data (remove data:image/jpeg;base64, part)
    return dataUrl.split(',')[1];
  } catch (error) {
    console.error('Error capturing frame:', error);
    return null;
  }
}

/**
 * Process a video frame for drowsiness detection using the backend
 * 
 * @param {HTMLVideoElement} videoElement The video element to process
 * @param {Function} onDrowsinessChange Callback for drowsiness status changes
 * @returns {Promise<Object>} Detection result with isDrowsy flag and confidence score
 */
async function processFrame(videoElement, onDrowsinessChange = null) {
  if (!isInitialized || isDetecting || !videoElement) {
    return lastPrediction;
  }
  
  // Don't send too many requests if there are errors
  if (errorCount >= MAX_ERRORS) {
    console.warn('Too many errors, suspending backend detection');
    return lastPrediction;
  }
  
  try {
    isDetecting = true;
    
    // Capture frame as base64
    const frameData = captureFrame(videoElement);
    if (!frameData) {
      throw new Error('Failed to capture frame');
    }
    
    // Use cached frame if data hasn't changed (prevents sending duplicate frames)
    if (frameCache === frameData) {
      isDetecting = false;
      return lastPrediction;
    }
    
    frameCache = frameData;
    
    // Send frame to the backend for processing
    const response = await fetch(`${apiUrl}/api/frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        frame: frameData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response
    const prediction = {
      isDrowsy: data.is_drowsy || data.isDrowsy || false,
      confidence: data.confidence || (data.drowsiness_level ? data.drowsiness_level / 100 : 0),
      timestamp: Date.now()
    };
    
    // Check if drowsiness state changed
    const stateChanged = prediction.isDrowsy !== lastPrediction.isDrowsy;
    
    // Update last prediction
    lastPrediction = prediction;
    
    // Notify about drowsiness change if callback is provided and state changed
    if (stateChanged && onDrowsinessChange) {
      onDrowsinessChange(lastPrediction);
    }
    
    // Reset error count on successful detection
    errorCount = 0;
    
    return lastPrediction;
  } catch (error) {
    console.error('Error processing frame with backend:', error);
    errorCount++;
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
    timestamp: 0
  };
  errorCount = 0;
  frameCache = null;
}

/**
 * Check if the detector is ready
 * 
 * @returns {boolean} True if the detector is ready
 */
function isReady() {
  return isInitialized;
}

// Export the module
export default {
  initialize,
  processFrame,
  resetDetector,
  isReady
}; 