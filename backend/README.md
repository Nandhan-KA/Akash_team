# Drowsiness Detection Backend

This is a simple Flask server that provides a backend for the drowsiness detection system.

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Run the server:

```bash
python app.py
```

The server will start on http://localhost:5000.

## API Endpoints

- `/status` - Check if the server is online
- `/api/status` - Check if the API is online
- `/api/start-drowsiness-detection` - Start drowsiness detection
- `/api/stop-drowsiness-detection` - Stop drowsiness detection
- `/api/drowsiness-data` - Get current drowsiness data
- `/video_feed` - Stream video feed from the camera

## Troubleshooting

If you encounter any issues:

1. Make sure your camera is connected and accessible
2. Check that port 5000 is not already in use
3. Ensure you have the required dependencies installed
4. Check the console output for error messages

## Development

This is a simulated backend that doesn't actually perform drowsiness detection. It provides mock data for testing the frontend application. To implement real drowsiness detection, you would need to integrate with a computer vision library like OpenCV and a machine learning model for drowsiness detection. 