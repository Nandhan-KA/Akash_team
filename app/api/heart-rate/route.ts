import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

// Status categories for heart rate
const statuses = ['normal', 'low', 'elevated', 'high'];

// Mock data generator for heart rate monitoring
function generateMockHeartRateData() {
  const now = new Date();
  
  // Generate random status with bias towards normal
  const randomValue = Math.random();
  let statusIndex;
  
  if (randomValue < 0.7) {
    statusIndex = 0; // normal (70%)
  } else if (randomValue < 0.8) {
    statusIndex = 1; // low (10%)
  } else if (randomValue < 0.95) {
    statusIndex = 2; // elevated (15%)
  } else {
    statusIndex = 3; // high (5%)
  }
  
  const status = statuses[statusIndex];
  
  // Generate heart rate based on status
  let bpm;
  switch (status) {
    case 'low':
      bpm = randomInt(40, 60);
      break;
    case 'normal':
      bpm = randomInt(60, 100);
      break;
    case 'elevated':
      bpm = randomInt(100, 120);
      break;
    case 'high':
      bpm = randomInt(120, 180);
      break;
    default:
      bpm = randomInt(60, 100);
  }
  
  // Generate heart rate history (last 10 entries)
  const heartRateHistory = [];
  for (let i = 0; i < 10; i++) {
    const historyTimestamp = new Date(now.getTime() - (i * 5000)); // 5 seconds apart
    // Generate a BPM with slight variation from current BPM
    const variation = randomInt(-5, 5);
    const historyBpm = Math.max(40, Math.min(180, bpm + variation));
    
    // Determine status based on BPM
    let historyStatus;
    if (historyBpm < 60) {
      historyStatus = 'low';
    } else if (historyBpm <= 100) {
      historyStatus = 'normal';
    } else if (historyBpm <= 120) {
      historyStatus = 'elevated';
    } else {
      historyStatus = 'high';
    }
    
    heartRateHistory.push({
      bpm: historyBpm,
      status: historyStatus,
      timestamp: historyTimestamp.toISOString()
    });
  }
  
  return {
    bpm,
    status,
    history: heartRateHistory,
    timestamp: now.toISOString()
  };
}

// GET endpoint for heart rate data
export async function GET() {
  try {
    const heartRateData = generateMockHeartRateData();
    return NextResponse.json(heartRateData);
  } catch (error) {
    console.error('Error in heart rate API:', error);
    return NextResponse.json(
      { error: 'Failed to get heart rate data' },
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
    const heartRateData = generateMockHeartRateData();
    
    return NextResponse.json({
      status: 'success',
      message: 'Frame processed successfully',
      data: heartRateData
    });
  } catch (error) {
    console.error('Error processing frame:', error);
    return NextResponse.json(
      { error: 'Failed to process frame' },
      { status: 500 }
    );
  }
} 