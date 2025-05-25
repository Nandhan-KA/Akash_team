const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;

// Mock detection API (no actual ML)
app.post('/api/detect-phone', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Simulate phone detection with 30% probability
    const hasPhone = Math.random() > 0.7;
    
    let detections = [];
    
    if (hasPhone) {
      // Generate random bounding box in lower half of image (more realistic)
      // Assume image is 640x480
      const width = 640;
      const height = 480;
      
      const boxWidth = 80 + Math.random() * 100;
      const boxHeight = 150 + Math.random() * 100;
      
      // Position phone in lower half of screen (where hands tend to be)
      const x = Math.max(0, Math.random() * (width - boxWidth));
      const y = Math.max(0, (height/2) + Math.random() * (height/2 - boxHeight));
      
      detections.push({
        bbox: [x, y, boxWidth, boxHeight],
        class: 'cell phone',
        score: 0.7 + Math.random() * 0.25
      });
    }
    
    // Add small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return res.json({
      detections,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', modelLoaded: true });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple phone detection server running on port ${PORT}`);
}); 