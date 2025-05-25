# Driver Drowsiness and Emotion Monitoring System

A modern web application for monitoring driver drowsiness, emotions, phone usage, and heart rate with real-time alerts.

## Features

- **Drowsiness Detection**: Real-time eye tracking and drowsiness detection
  - Eye closure duration monitoring
  - Head nodding detection
  - Emergency SOS alerts for dangerous drowsiness
- **Emotion Recognition**: Facial expression analysis to determine driver emotions
- **Phone Usage Detection**: Detects if the driver is using a phone
- **Heart Rate Monitoring**: Monitors driver's heart rate and detects abnormal patterns
- **Alert System**: Generates alerts for dangerous conditions
- **Music Player**: Mood-based music selection to enhance driver alertness

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **API**: Next.js API Routes
- **Browser-Based Detection**: TensorFlow.js, face-api.js

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or pnpm (recommended)

### Installation

1. **Install dependencies**:

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

If you encounter npm installation issues, try:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules
rm package-lock.json

# Install dependencies again
npm install
```

2. **Create environment file**:

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_API_URL=/api
```

### Running the Application

```bash
# Development mode
pnpm dev

# Or using npm
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Alert Sound

The system requires an alert sound file for the drowsiness SOS feature:

1. Download an emergency alert sound in MP3 format
2. Rename it to `alert.mp3`
3. Place it in the `public` folder of the project

You can find free alert sounds on websites like:
- [Uppbeat.io](https://uppbeat.io/sfx/category/emergency)
- [Mixkit](https://mixkit.co/free-sound-effects/alert/)
- [Freesound](https://freesound.org/search/?q=alert)

## API Endpoints

The application provides the following API endpoints:

- `/api` - API information
- `/api/status` - System status
- `/api/drowsiness` - Drowsiness detection data
- `/api/emotion` - Emotion recognition data
- `/api/phone` - Phone detection data
- `/api/heart-rate` - Heart rate monitoring data
- `/api/alert` - Alert management
- `/api/music` - Music player controls

## In-Browser Detection

This implementation uses client-side detection with JavaScript libraries for:

1. **Phone Detection**: Uses TensorFlow.js with COCO-SSD model
2. **Emotion Recognition**: Uses face-api.js for facial expression analysis

This approach eliminates the need for a separate Python backend for these features.

## Building for Production

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TensorFlow.js team for the machine learning libraries
- face-api.js for facial recognition capabilities
- Next.js team for the React framework 