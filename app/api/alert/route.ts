import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

// Alert types
const alertTypes = ['drowsiness', 'emotion', 'phone', 'heart_rate', 'sos'];

// In-memory alert storage (would be a database in production)
let alertHistory: Alert[] = [];

// Initialize with some sample alerts
for (let i = 0; i < 5; i++) {
  const alertType = alertTypes[randomInt(0, alertTypes.length - 1)];
  const now = new Date();
  const timestamp = new Date(now.getTime() - (i * 600000)); // 10 minutes apart
  
  alertHistory.push(createAlert(alertType, timestamp));
}

// Alert interface
interface Alert {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  is_acknowledged: boolean;
  details?: any;
}

// Function to create an alert
function createAlert(type: string, timestamp: Date = new Date()): Alert {
  const id = Date.now() + randomInt(0, 1000);
  let message = '';
  let severity: 'low' | 'medium' | 'high' = 'medium';
  let details = {};
  
  switch (type) {
    case 'drowsiness':
      message = 'Drowsiness detected! Take a break.';
      severity = randomValue(['medium', 'high'], [0.7, 0.3]);
      details = { ear_value: (0.18 + Math.random() * 0.07).toFixed(2) };
      break;
    case 'emotion':
      message = `Driver appears ${randomValue(['angry', 'sad'], [0.6, 0.4])}. Monitor behavior.`;
      severity = 'medium';
      break;
    case 'phone':
      message = 'Phone usage detected while driving!';
      severity = 'high';
      break;
    case 'heart_rate':
      const condition = randomValue(['elevated', 'high', 'low'], [0.6, 0.3, 0.1]);
      message = `Heart rate ${condition}! Check driver condition.`;
      severity = condition === 'high' ? 'high' : 'medium';
      details = { bpm: condition === 'low' ? randomInt(40, 55) : 
                  condition === 'elevated' ? randomInt(100, 120) : 
                  randomInt(120, 180) };
      break;
    case 'sos':
      message = 'SOS alert triggered! Emergency services notified.';
      severity = 'high';
      break;
    default:
      message = 'Driver monitoring alert';
      severity = 'low';
  }
  
  return {
    id,
    type,
    message,
    timestamp: timestamp.toISOString(),
    severity,
    is_acknowledged: false,
    details
  };
}

// Helper function to select a random value based on weights
function randomValue<T>(values: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < values.length; i++) {
    if (random < weights[i]) {
      return values[i];
    }
    random -= weights[i];
  }
  
  return values[0];
}

// GET endpoint for alert history
export async function GET() {
  try {
    return NextResponse.json(alertHistory);
  } catch (error) {
    console.error('Error in alert API:', error);
    return NextResponse.json(
      { error: 'Failed to get alert history' },
      { status: 500 }
    );
  }
}

// POST endpoint for creating a new alert
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, message, severity, details } = body;
    
    if (!type) {
      return NextResponse.json(
        { error: 'Alert type is required' },
        { status: 400 }
      );
    }
    
    // Create a new alert
    const alert = {
      id: Date.now(),
      type,
      message: message || `Alert: ${type}`,
      timestamp: new Date().toISOString(),
      severity: severity || 'medium',
      is_acknowledged: false,
      details: details || {}
    };
    
    // Add to alert history
    alertHistory.unshift(alert);
    
    // Keep only the most recent 50 alerts
    if (alertHistory.length > 50) {
      alertHistory = alertHistory.slice(0, 50);
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Alert created successfully',
      data: alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// PUT endpoint for acknowledging an alert
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }
    
    // Find and update the alert
    const alertIndex = alertHistory.findIndex(alert => alert.id === id);
    
    if (alertIndex === -1) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    alertHistory[alertIndex].is_acknowledged = true;
    
    return NextResponse.json({
      status: 'success',
      message: 'Alert acknowledged successfully',
      data: alertHistory[alertIndex]
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
} 