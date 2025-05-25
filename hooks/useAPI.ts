import { useState, useEffect, useCallback } from 'react';

// Define response types
interface DrowsinessData {
  ear_value: number;
  is_drowsy: boolean;
  blink_count: number;
  yawn_count: number;
  head_pose: { x: number; y: number; z: number };
  drowsiness_level: number;
  alert_status: 'normal' | 'medium' | 'high';
}

interface EmotionData {
  current_emotion: string;
  confidence: number;
  emotion_history: Array<{
    emotion: string;
    confidence: number;
    timestamp: string;
  }>;
}

interface PhoneData {
  is_detected: boolean;
  confidence: number;
  last_detected: string | null;
}

interface HeartRateData {
  bpm: number;
  status: string;
  history: Array<{
    bpm: number;
    status: string;
    timestamp: string;
  }>;
}

interface SystemStatus {
  status: string;
  timestamp: string;
  components: {
    drowsiness_detector: string;
    emotion_recognizer: string;
    phone_detector: string;
    heart_rate_monitor: string;
    music_player: string;
    sos_alert: string;
  };
}

interface AlertHistoryItem {
  id: number;
  type: string;
  message: string;
  timestamp: string;
}

export function useAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  // Function to check API connection
  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/status`);
      if (response.ok) {
        setIsConnected(true);
        setError(null);
      } else {
        setIsConnected(false);
        setError('API server is not responding correctly');
      }
    } catch (err) {
      setIsConnected(false);
      setError('Cannot connect to API server');
      console.error('API connection error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);
  
  // Check connection on mount
  useEffect(() => {
    checkConnection();
    
    // Set up interval to check connection periodically
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkConnection]);
  
  // Function to send a frame to the API
  const sendFrame = async (frameData: string): Promise<boolean> => {
    if (!isConnected) return false;
    
    try {
      const response = await fetch(`${apiUrl}/frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frame: frameData }),
      });
      
      return response.ok;
    } catch (err) {
      console.error('Error sending frame:', err);
      return false;
    }
  };
  
  // Function to get drowsiness data
  const getDrowsinessData = async (): Promise<DrowsinessData | null> => {
    if (!isConnected) return null;
    
    try {
      const response = await fetch(`${apiUrl}/drowsiness`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error getting drowsiness data:', err);
      return null;
    }
  };
  
  // Function to get emotion data
  const getEmotionData = async (): Promise<EmotionData | null> => {
    if (!isConnected) return null;
    
    try {
      const response = await fetch(`${apiUrl}/emotion`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error getting emotion data:', err);
      return null;
    }
  };
  
  // Function to get phone detection data
  const getPhoneData = async (): Promise<PhoneData | null> => {
    if (!isConnected) return null;
    
    try {
      const response = await fetch(`${apiUrl}/phone`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error getting phone data:', err);
      return null;
    }
  };
  
  // Function to get heart rate data
  const getHeartRateData = async (): Promise<HeartRateData | null> => {
    if (!isConnected) return null;
    
    try {
      const response = await fetch(`${apiUrl}/heart-rate`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error getting heart rate data:', err);
      return null;
    }
  };
  
  // Function to get all results at once
  const getAllResults = async () => {
    if (!isConnected) return null;
    
    try {
      const response = await fetch(`${apiUrl}/results`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error getting all results:', err);
      return null;
    }
  };
  
  // Function to get alert history
  const getAlertHistory = async (): Promise<AlertHistoryItem[] | null> => {
    if (!isConnected) return null;
    
    try {
      const response = await fetch(`${apiUrl}/alert-history`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error getting alert history:', err);
      return null;
    }
  };
  
  // Function to trigger SOS alert
  const triggerSOS = async (reason: string = 'Manual trigger'): Promise<boolean> => {
    if (!isConnected) return false;
    
    try {
      const response = await fetch(`${apiUrl}/trigger-sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      return response.ok;
    } catch (err) {
      console.error('Error triggering SOS:', err);
      return false;
    }
  };
  
  // Function to play music based on mood
  const playMusic = async (mood: string): Promise<boolean> => {
    if (!isConnected) return false;
    
    try {
      const response = await fetch(`${apiUrl}/music/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood }),
      });
      
      return response.ok;
    } catch (err) {
      console.error('Error playing music:', err);
      return false;
    }
  };
  
  // Function to stop music
  const stopMusic = async (): Promise<boolean> => {
    if (!isConnected) return false;
    
    try {
      const response = await fetch(`${apiUrl}/music/stop`, {
        method: 'POST',
      });
      
      return response.ok;
    } catch (err) {
      console.error('Error stopping music:', err);
      return false;
    }
  };
  
  return {
    isConnected,
    isLoading,
    error,
    checkConnection,
    sendFrame,
    getDrowsinessData,
    getEmotionData,
    getPhoneData,
    getHeartRateData,
    getAllResults,
    getAlertHistory,
    triggerSOS,
    playMusic,
    stopMusic,
  };
} 