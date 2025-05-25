import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

// Mock data generator for drowsiness detection
function generateMockDrowsinessData() {
  const now = new Date();
  const earValue = 0.2 + Math.random() * 0.15; // Between 0.2 and 0.35
  const isDrowsy = earValue < 0.25;
  const blinkCount = randomInt(5, 30);
  const yawnCount = randomInt(0, 5);
  
  // Generate random head pose
  const headPose = {
    x: (Math.random() * 20 - 10).toFixed(1),
    y: (Math.random() * 20 - 10).toFixed(1),
    z: (Math.random() * 20 - 10).toFixed(1),
  };
  
  // Calculate drowsiness level based on EAR and blink count
  let drowsinessLevel = 0;
  if (isDrowsy) {
    drowsinessLevel = 70 + randomInt(0, 30);
  } else {
    drowsinessLevel = randomInt(5, 35);
  }
  
  // Determine alert status
  let alertStatus = 'normal';
  if (drowsinessLevel > 70) {
    alertStatus = 'high';
  } else if (drowsinessLevel > 40) {
    alertStatus = 'medium';
  }
  
  return {
    ear_value: Number(earValue.toFixed(2)),
    is_drowsy: isDrowsy,
    blink_count: blinkCount,
    yawn_count: yawnCount,
    head_pose: headPose,
    drowsiness_level: drowsinessLevel,
    alert_status: alertStatus,
    timestamp: now.toISOString(),
  };
}

// GET endpoint for drowsiness data
export async function GET() {
  try {
    const drowsinessData = generateMockDrowsinessData();
    return NextResponse.json(drowsinessData);
  } catch (error) {
    console.error('Error in drowsiness API:', error);
    return NextResponse.json(
      { error: 'Failed to get drowsiness data' },
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
    const drowsinessData = generateMockDrowsinessData();
    
    return NextResponse.json({
      status: 'success',
      message: 'Frame processed successfully',
      data: drowsinessData
    });
  } catch (error) {
    console.error('Error processing frame:', error);
    return NextResponse.json(
      { error: 'Failed to process frame' },
      { status: 500 }
    );
  }
} 