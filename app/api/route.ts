import { NextResponse } from 'next/server';

// GET endpoint for API information
export async function GET() {
  try {
    const now = new Date();
    
    // API endpoints information
    const endpoints = [
      {
        path: '/api/status',
        methods: ['GET'],
        description: 'Get the status of all system components'
      },
      {
        path: '/api/drowsiness',
        methods: ['GET', 'POST'],
        description: 'Get drowsiness detection data or process frame data'
      },
      {
        path: '/api/emotion',
        methods: ['GET', 'POST'],
        description: 'Get emotion recognition data or process frame data'
      },
      {
        path: '/api/phone',
        methods: ['GET', 'POST'],
        description: 'Get phone detection data or process frame data'
      },
      {
        path: '/api/heart-rate',
        methods: ['GET', 'POST'],
        description: 'Get heart rate monitoring data or process frame data'
      },
      {
        path: '/api/alert',
        methods: ['GET', 'POST', 'PUT'],
        description: 'Get alert history, create new alerts, or acknowledge alerts'
      },
      {
        path: '/api/music',
        methods: ['GET', 'POST'],
        description: 'Get current music state or control music playback'
      }
    ];
    
    return NextResponse.json({
      name: 'Driver Drowsiness and Emotion Monitoring System API',
      version: '1.0.0',
      description: 'API for the Driver Drowsiness and Emotion Monitoring System with browser-based detection',
      endpoints,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error in API info endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get API information' },
      { status: 500 }
    );
  }
} 