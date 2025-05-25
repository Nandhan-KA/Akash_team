// Drowsiness Detection Coordinator
// This module coordinates between local (browser-based) and backend (Python-based) drowsiness detection

import localDetection from './localDrowsinessDetection';
import backendDetection from './backendDrowsinessDetection';

// Detection modes
const DETECTION_MODES = {
  LOCAL: 'local',    // Browser-based TensorFlow.js
  BACKEND: 'backend' // Python backend server
};

// State
let currentMode = DETECTION_MODES.LOCAL;
let isInitialized = false;
let detector = localDetection;

// Configuration
const config = {
  localModelPath: '/models/drowsiness_model',
  backendApiUrl: 'http://localhost:5000/api/drowsiness-detection'
};

/**
 * Initialize the drowsiness detection system
 * 
 * @param {Object} options Configuration options
 * @param {string} options.mode Detection mode ('local' or 'backend')
 * @param {string} options.localModelPath Path to the local TensorFlow.js model
 * @param {string} options.backendApiUrl URL for the backend API
 * @returns {Promise<boolean>} True if initialization was successful
 */
async function initialize(options = {}) {
  // Update configuration with provided options
  if (options.localModelPath) {
    config.localModelPath = options.localModelPath;
  }
  
  if (options.backendApiUrl) {
    config.backendApiUrl = options.backendApiUrl;
  }
  
  // Set detection mode
  if (options.mode && (options.mode === DETECTION_MODES.LOCAL || options.mode === DETECTION_MODES.BACKEND)) {
    currentMode = options.mode;
  }
  
  // Initialize the appropriate detector
  try {
    if (currentMode === DETECTION_MODES.LOCAL) {
      detector = localDetection;
      isInitialized = await localDetection.loadModel(config.localModelPath);
    } else {
      detector = backendDetection;
      isInitialized = await backendDetection.initialize({ apiUrl: config.backendApiUrl });
    }
    
    console.log(`Drowsiness detection initialized in ${currentMode} mode`);
    return isInitialized;
  } catch (error) {
    console.error(`Failed to initialize drowsiness detection in ${currentMode} mode:`, error);
    isInitialized = false;
    return false;
  }
}

/**
 * Switch the detection mode
 * 
 * @param {string} mode The detection mode to switch to ('local' or 'backend')
 * @returns {Promise<boolean>} True if switch was successful
 */
async function switchMode(mode) {
  if (mode === currentMode) {
    console.log(`Already in ${mode} mode`);
    return true;
  }
  
  if (mode !== DETECTION_MODES.LOCAL && mode !== DETECTION_MODES.BACKEND) {
    console.error(`Invalid detection mode: ${mode}`);
    return false;
  }
  
  // Reset current detector
  detector.resetDetector();
  
  // Update mode and detector
  currentMode = mode;
  detector = currentMode === DETECTION_MODES.LOCAL ? localDetection : backendDetection;
  
  // Initialize the new detector
  try {
    if (currentMode === DETECTION_MODES.LOCAL) {
      isInitialized = await localDetection.loadModel(config.localModelPath);
    } else {
      isInitialized = await backendDetection.initialize({ apiUrl: config.backendApiUrl });
    }
    
    console.log(`Switched to ${currentMode} mode`);
    return isInitialized;
  } catch (error) {
    console.error(`Failed to switch to ${currentMode} mode:`, error);
    isInitialized = false;
    return false;
  }
}

/**
 * Process a video frame for drowsiness detection
 * 
 * @param {HTMLVideoElement} videoElement The video element to process
 * @param {Function} onDrowsinessChange Callback for drowsiness status changes
 * @returns {Promise<Object>} Detection result
 */
async function processFrame(videoElement, onDrowsinessChange = null) {
  if (!isInitialized) {
    console.warn('Drowsiness detection is not initialized');
    return { isDrowsy: false, confidence: 0, timestamp: Date.now() };
  }
  
  return await detector.processFrame(videoElement, onDrowsinessChange);
}

/**
 * Reset the drowsiness detector
 */
function resetDetector() {
  if (detector) {
    detector.resetDetector();
  }
  isInitialized = false;
}

/**
 * Check if the detector is ready
 * 
 * @returns {boolean} True if the detector is ready
 */
function isReady() {
  return isInitialized && detector && detector.isReady();
}

/**
 * Get the current detection mode
 * 
 * @returns {string} Current detection mode ('local' or 'backend')
 */
function getCurrentMode() {
  return currentMode;
}

// Export the module
export default {
  DETECTION_MODES,
  initialize,
  switchMode,
  processFrame,
  resetDetector,
  isReady,
  getCurrentMode
}; 