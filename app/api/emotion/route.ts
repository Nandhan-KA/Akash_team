import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

// Available emotions
const emotions = ['happy', 'sad', 'angry', 'neutral'];

// Mock data generator for emotion recognition
function generateMockEmotionData() {
  const now = new Date();
  
  // Generate a random emotion with bias towards neutral
  const randomValue = Math.random();
  let emotionIndex;
  
  if (randomValue < 0.4) {
    emotionIndex = 3; // neutral
  } else if (randomValue < 0.6) {
    emotionIndex = 0; // happy
  } else if (randomValue < 0.8) {
    emotionIndex = 1; // sad
  } else {
    emotionIndex = 2; // angry
  }
  
  const currentEmotion = emotions[emotionIndex];
  
  // Generate a confidence value (higher for neutral, lower for others)
  let confidence = 0;
  if (currentEmotion === 'neutral') {
    confidence = 0.7 + (Math.random() * 0.3); // 0.7 to 1.0
  } else {
    confidence = 0.5 + (Math.random() * 0.4); // 0.5 to 0.9
  }
  
  // Generate emotion history (last 5 entries)
  const emotionHistory = [];
  for (let i = 0; i < 5; i++) {
    const historyTimestamp = new Date(now.getTime() - (i * 2000)); // 2 seconds apart
    const randomEmotion = emotions[randomInt(0, emotions.length - 1)];
    const randomConfidence = 0.5 + (Math.random() * 0.5); // 0.5 to 1.0
    
    emotionHistory.push({
      emotion: randomEmotion,
      confidence: Number(randomConfidence.toFixed(2)),
      timestamp: historyTimestamp.toISOString()
    });
  }
  
  return {
    current_emotion: currentEmotion,
    confidence: Number(confidence.toFixed(2)),
    emotion_history: emotionHistory,
    timestamp: now.toISOString()
  };
}

// GET endpoint for emotion data
export async function GET() {
  try {
    const emotionData = generateMockEmotionData();
    return NextResponse.json(emotionData);
  } catch (error) {
    console.error('Error in emotion recognition API:', error);
    return NextResponse.json(
      { error: 'Failed to get emotion data' },
      { status: 500 }
    );
  }
}

// POST endpoint for processing frame data
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In a real implementation, this would process the frame data
    // For this mock version, we just return mock data
    const emotionData = generateMockEmotionData();
    
    return NextResponse.json({
      status: 'success',
      message: 'Frame processed successfully',
      data: emotionData
    });
  } catch (error) {
    console.error('Error processing frame:', error);
    return NextResponse.json(
      { error: 'Failed to process frame' },
      { status: 500 }
    );
  }
} 