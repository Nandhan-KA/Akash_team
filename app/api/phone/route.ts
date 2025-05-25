import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

// Mock data generator for phone detection
function generateMockPhoneData() {
  const now = new Date();
  
  // Generate random phone detection with bias towards not detected
  const randomValue = Math.random();
  const isDetected = randomValue > 0.8; // 20% chance of phone being detected
  
  // Generate confidence value
  let confidence = 0;
  if (isDetected) {
    confidence = 0.6 + (Math.random() * 0.4); // 0.6 to 1.0
  } else {
    confidence = 0; // No confidence if not detected
  }
  
  // Generate last detected time (if detected)
  let lastDetected = null;
  if (isDetected) {
    lastDetected = now.toISOString();
  } else {
    // 50% chance of having a previous detection
    if (Math.random() > 0.5) {
      // Last detected between 1 minute and 2 hours ago
      const minutesAgo = randomInt(1, 120);
      const pastTime = new Date(now.getTime() - (minutesAgo * 60000));
      lastDetected = pastTime.toISOString();
    }
  }
  
  return {
    is_detected: isDetected,
    confidence: Number(confidence.toFixed(2)),
    last_detected: lastDetected,
    timestamp: now.toISOString()
  };
}

// GET endpoint for phone detection data
export async function GET() {
  try {
    const phoneData = generateMockPhoneData();
    return NextResponse.json(phoneData);
  } catch (error) {
    console.error('Error in phone detection API:', error);
    return NextResponse.json(
      { error: 'Failed to get phone detection data' },
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
    const phoneData = generateMockPhoneData();
    
    return NextResponse.json({
      status: 'success',
      message: 'Frame processed successfully',
      data: phoneData
    });
  } catch (error) {
    console.error('Error processing frame:', error);
    return NextResponse.json(
      { error: 'Failed to process frame' },
      { status: 500 }
    );
  }
} 