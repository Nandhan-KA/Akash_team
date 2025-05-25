// Drowsiness Detection Manager
// This module handles switching between local and backend drowsiness detection

import localDetector from './localDrowsinessDetection';
import backendDetector from './backendDrowsinessDetection';

// Detection modes
const DETECTION_MODES = {
  LOCAL: 'local',
  BACKEND: 'backend'
};

// Current state
let currentMode = DETECTION_MODES.LOCAL;
let isInitialized = false;
let detectionCallbackRef = null;
let processingFrame = false;

// Initialize the selected drowsiness detection mode
async function initialize(mode = DETECTION_MODES.LOCAL, options = {}) {
  try {
    currentMode = mode;
    
    if (mode === DETECTION_MODES.LOCAL) {
      const modelPath = options.modelPath || '/models/drowsiness_model/model.json';
      await localDetector.loadModel(modelPath);
      isInitialized = localDetector.isReady();
    } else {
      const apiEndpoint = options.apiEndpoint || 'http://localhost:5000/api/drowsiness';
      await backendDetector.initializeConnection(apiEndpoint);
      isInitialized = backendDetector.isReady();
    }
    
    return isInitialized;
  } catch (error) {
    console.error('Error initializing drowsiness detection:', error);
    isInitialized = false;
    return false;
  }
}

// Process video frame based on current mode
async function processFrame(videoElement, onDrowsinessChange) {
  if (!isInitialized) {
    console.warn('Drowsiness detection not initialized');
    return false;
  }
  
  // Store callback for mode switching
  if (onDrowsinessChange) {
    detectionCallbackRef = onDrowsinessChange;
  }
  
  // Prevent concurrent processing of frames to avoid freezing
  if (processingFrame) return false;
  
  try {
    processingFrame = true;
    
    let result;
    if (currentMode === DETECTION_MODES.LOCAL) {
      result = await localDetector.processFrame(videoElement, detectionCallbackRef);
    } else {
      result = await backendDetector.processFrame(videoElement, detectionCallbackRef);
    }
    
    processingFrame = false;
    return result;
  } catch (error) {
    console.error('Error processing frame:', error);
    processingFrame = false;
    return false;
  }
}

// Switch between detection modes
async function switchMode(newMode, options = {}) {
  if (newMode === currentMode) return true;
  
  // Reset current detector
  if (currentMode === DETECTION_MODES.LOCAL) {
    localDetector.resetDetector();
  } else {
    backendDetector.resetDetector();
  }
  
  // Initialize new mode
  return await initialize(newMode, options);
}

// Reset the current detector
function resetDetector() {
  if (!isInitialized) return;
  
  if (currentMode === DETECTION_MODES.LOCAL) {
    localDetector.resetDetector();
  } else {
    backendDetector.resetDetector();
  }
}

// Check if detector is ready
function isReady() {
  return isInitialized;
}

// Get current detection mode
function getCurrentMode() {
  return currentMode;
}

// Export the functions and constants
export default {
  DETECTION_MODES,
  initialize,
  processFrame,
  switchMode,
  resetDetector,
  isReady,
  getCurrentMode
}; 