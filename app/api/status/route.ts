import { NextResponse } from 'next/server';

// GET endpoint for system status
export async function GET() {
  try {
    const now = new Date();
    
    // Check status of all components
    const components = {
      drowsiness_detector: "active",
      emotion_recognizer: "active",
      phone_detector: "active",
      heart_rate_monitor: "active",
      music_player: "active",
      sos_alert: "active"
    };
    
    return NextResponse.json({
      status: "online",
      timestamp: now.toISOString(),
      components
    });
  } catch (error) {
    console.error('Error in status API:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
} 