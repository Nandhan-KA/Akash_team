/**
 * Drowsiness Detection Controller
 * 
 * This module orchestrates drowsiness detection using either:
 * 1. Backend (Python) detection via API calls
 * 2. Local (Browser) detection using face-api.js
 * 
 * It automatically handles fallback between modes if one fails.
 */

import BackendDetection from './backendDrowsinessDetection';
import LocalDetection from './localDrowsinessDetection';

// Modes of operation
export const DETECTION_MODES = {
  BACKEND: 'backend', // Server-side detection
  LOCAL: 'local',     // Browser-based detection
};

// Module state
let isInitialized = false;
let isDetecting = false;
let currentMode = DETECTION_MODES.BACKEND;
let options = {};
let detectionTimer = null;
let videoElement = null;
let callbackFunction = null;
let failedAttempts = 0;

/**
 * Default options for the controller
 */
const defaultOptions = {
  mode: DETECTION_MODES.BACKEND, // Default to backend mode
  modelPath: '/models/face-api', // Path to local model
  backendUrl: 'http://localhost:5000', // URL to backend API
  detectionFrequency: 100, // Process every 100ms
  drowsinessThreshold: 0.7, // Threshold to detect drowsiness
  maxFailedAttemptsBeforeFallback: 3 // Number of failed attempts before switching modes
};

/**
 * Initialize the drowsiness detection
 * @param {Object} config Configuration options
 * @returns {Promise<boolean>} True if initialization was successful
 */
async function initialize(config = {}) {
  try {
    // Merge config with default options
    options = { ...defaultOptions, ...config };
    
    // Reset state
    isInitialized = false;
    currentMode = config.mode || defaultOptions.mode;
    
    console.log(`Attempting to initialize drowsiness detection in ${currentMode} mode`);
    
    // Initialize the selected detection mode
    if (currentMode === DETECTION_MODES.BACKEND) {
      try {
        // Initialize backend detector
        await BackendDetection.initialize({
          apiUrl: options.backendUrl
        });
        console.log('Backend detection initialized successfully');
      } catch (error) {
        console.error('Failed to initialize backend detector:', error);
        console.log('Falling back to local mode');
        currentMode = DETECTION_MODES.LOCAL;
      }
    }
    
    // Always initialize local detection as fallback, even if we're using backend
    try {
      await LocalDetection.initialize({
        modelPath: options.modelPath
      });
      console.log('Local detection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local detector:', error);
      
      // If backend initialization also failed, we can't proceed
      if (currentMode === DETECTION_MODES.LOCAL) {
        throw new Error('Failed to initialize drowsiness detection in all modes');
      }
    }
    
    isInitialized = true;
    console.log(`Drowsiness detection initialized in ${currentMode} mode`);
    return true;
  } catch (error) {
    console.error('Error initializing drowsiness detection:', error);
    throw error;
  }
}

/**
 * Start drowsiness detection
 * @param {HTMLVideoElement} video Video element for local processing
 * @param {Function} callback Callback function for detection results
 * @returns {Promise<boolean>} True if detection started successfully
 */
async function startDetection(video, callback) {
  try {
    if (!isInitialized) {
      throw new Error('Drowsiness detection not initialized');
    }
    
    if (isDetecting) {
      console.warn('Drowsiness detection already running');
      return true;
    }
    
    // Store video element and callback
    videoElement = video;
    callbackFunction = callback;
    failedAttempts = 0;
    
    // Start detection loop
    isDetecting = true;
    
    if (currentMode === DETECTION_MODES.BACKEND) {
      console.log('Starting backend drowsiness detection');
      // Backend mode doesn't need a detection timer - it's handled by polling
      // but we need to inform the backend to start detection
      await BackendDetection.startDetection();
    }
    
    // Start detection timer
    scheduleNextDetection();
    
    return true;
  } catch (error) {
    console.error('Error starting drowsiness detection:', error);
    isDetecting = false;
    return false;
  }
}

/**
 * Schedule the next detection cycle
 */
function scheduleNextDetection() {
  if (!isDetecting) return;
  
  clearTimeout(detectionTimer);
  detectionTimer = setTimeout(detectDrowsiness, options.detectionFrequency);
}

/**
 * Detect drowsiness in the current video frame
 */
async function detectDrowsiness() {
  if (!isDetecting || !videoElement) {
    scheduleNextDetection();
    return;
  }
  
  try {
    let result;
    
    // Process frame using the appropriate detection method
    if (currentMode === DETECTION_MODES.BACKEND) {
      result = await BackendDetection.processFrame();
    } else {
      result = await LocalDetection.processFrame(videoElement);
    }
    
    // Reset failed attempts counter on success
    if (result) {
      failedAttempts = 0;
      
      // Call callback with results
      if (callbackFunction) {
        callbackFunction(result);
      }
    }
  } catch (error) {
    console.error('Error in drowsiness detection:', error);
    failedAttempts++;
    
    // Check if we need to switch modes
    if (failedAttempts >= options.maxFailedAttemptsBeforeFallback) {
      // Try to switch modes if consecutive failures
      if (currentMode === DETECTION_MODES.BACKEND) {
        console.warn(`Backend detection failed ${failedAttempts} times. Switching to local mode`);
        currentMode = DETECTION_MODES.LOCAL;
        failedAttempts = 0;
      }
    }
  } finally {
    // Schedule next detection
    scheduleNextDetection();
  }
}

/**
 * Stop drowsiness detection
 */
function stopDetection() {
  isDetecting = false;
  clearTimeout(detectionTimer);
  
  // Stop backend detection if it was active
  if (currentMode === DETECTION_MODES.BACKEND) {
    BackendDetection.stopDetection()
      .catch(error => console.warn('Error stopping backend detection:', error));
  }
  
  console.log('Drowsiness detection stopped');
}

/**
 * Get the current detection mode
 * @returns {string} Current detection mode
 */
function getCurrentMode() {
  return currentMode;
}

/**
 * Switch between detection modes
 * @param {string} mode The mode to switch to
 * @returns {Promise<boolean>} True if switch was successful
 */
async function switchMode(mode) {
  if (!Object.values(DETECTION_MODES).includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  
  if (mode === currentMode) {
    return true; // Already in this mode
  }
  
  try {
    // If detecting, stop first
    const wasDetecting = isDetecting;
    if (wasDetecting) {
      stopDetection();
    }
    
    // Switch mode
    currentMode = mode;
    console.log(`Switched to ${mode} mode`);
    
    // If we were detecting, restart in new mode
    if (wasDetecting && videoElement) {
      await startDetection(videoElement, callbackFunction);
    }
    
    return true;
  } catch (error) {
    console.error(`Error switching to ${mode} mode:`, error);
    return false;
  }
}

// Export the controller API
export default {
  initialize,
  startDetection,
  stopDetection,
  getCurrentMode,
  switchMode
}; 