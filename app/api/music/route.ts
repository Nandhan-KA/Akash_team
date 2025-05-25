import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

// Track interface
interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
}

// Music state interface
interface MusicState {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentMood: string | null;
  playlist: Track[];
  volume: number;
  startTime: string | null;
  position: number;
}

// Music mood categories
const moods = ['happy', 'sad', 'calm', 'energetic', 'focus'];

// Sample music data by mood
const musicLibrary: Record<string, Track[]> = {
  happy: [
    { id: 'h1', title: 'Walking on Sunshine', artist: 'Katrina & The Waves', duration: 238 },
    { id: 'h2', title: 'Happy', artist: 'Pharrell Williams', duration: 232 },
    { id: 'h3', title: 'Good Vibrations', artist: 'The Beach Boys', duration: 218 },
    { id: 'h4', title: 'Dancing Queen', artist: 'ABBA', duration: 230 },
    { id: 'h5', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', duration: 270 }
  ],
  sad: [
    { id: 's1', title: 'Someone Like You', artist: 'Adele', duration: 285 },
    { id: 's2', title: 'Fix You', artist: 'Coldplay', duration: 295 },
    { id: 's3', title: 'Tears in Heaven', artist: 'Eric Clapton', duration: 274 },
    { id: 's4', title: 'Hurt', artist: 'Johnny Cash', duration: 216 },
    { id: 's5', title: 'Nothing Compares 2 U', artist: 'Sinéad O\'Connor', duration: 310 }
  ],
  calm: [
    { id: 'c1', title: 'Weightless', artist: 'Marconi Union', duration: 480 },
    { id: 'c2', title: 'Claire de Lune', artist: 'Claude Debussy', duration: 320 },
    { id: 'c3', title: 'Watermark', artist: 'Enya', duration: 229 },
    { id: 'c4', title: 'River Flows In You', artist: 'Yiruma', duration: 185 },
    { id: 'c5', title: 'Gymnopedie No.1', artist: 'Erik Satie', duration: 212 }
  ],
  energetic: [
    { id: 'e1', title: 'Eye of the Tiger', artist: 'Survivor', duration: 244 },
    { id: 'e2', title: 'Thunderstruck', artist: 'AC/DC', duration: 292 },
    { id: 'e3', title: 'Till I Collapse', artist: 'Eminem', duration: 297 },
    { id: 'e4', title: 'Don\'t Stop Me Now', artist: 'Queen', duration: 214 },
    { id: 'e5', title: 'Stronger', artist: 'Kanye West', duration: 312 }
  ],
  focus: [
    { id: 'f1', title: 'Brain Waves', artist: 'Alpha Waves', duration: 540 },
    { id: 'f2', title: 'Study Session', artist: 'Focus Music', duration: 620 },
    { id: 'f3', title: 'Deep Concentration', artist: 'Mind Melody', duration: 480 },
    { id: 'f4', title: 'Clarity', artist: 'Ambient Focus', duration: 375 },
    { id: 'f5', title: 'Theta Rhythm', artist: 'Brain Boost', duration: 420 }
  ]
};

// Current music state (would be stored in a database in production)
let currentMusic: MusicState = {
  isPlaying: false,
  currentTrack: null,
  currentMood: null,
  playlist: [],
  volume: 70,
  startTime: null,
  position: 0
};

// Function to select tracks for a mood
function getTracksForMood(mood: string): Track[] | { error: string } {
  if (!moods.includes(mood)) {
    return {
      error: `Invalid mood: ${mood}. Available moods: ${moods.join(', ')}`
    };
  }
  
  const tracks = musicLibrary[mood];
  return tracks;
}

// GET endpoint for current music state
export async function GET() {
  try {
    // Calculate current position if playing
    if (currentMusic.isPlaying && currentMusic.startTime && currentMusic.currentTrack) {
      const now = new Date();
      const elapsed = (now.getTime() - new Date(currentMusic.startTime).getTime()) / 1000;
      currentMusic.position = Math.min(
        elapsed, 
        currentMusic.currentTrack.duration
      );
      
      // Loop back to beginning if track finished
      if (currentMusic.position >= currentMusic.currentTrack.duration) {
        // Move to next track in playlist
        if (currentMusic.playlist.length > 0) {
          currentMusic.currentTrack = currentMusic.playlist.shift() || null;
          currentMusic.startTime = new Date().toISOString();
          currentMusic.position = 0;
          
          // Add a new track to playlist to keep it populated
          if (currentMusic.currentMood) {
            const tracksResult = getTracksForMood(currentMusic.currentMood);
            if (!('error' in tracksResult)) {
              const randomTrack = tracksResult[randomInt(0, tracksResult.length - 1)];
              currentMusic.playlist.push(randomTrack);
            }
          }
        } else {
          currentMusic.isPlaying = false;
          currentMusic.position = 0;
        }
      }
    }
    
    return NextResponse.json(currentMusic);
  } catch (error) {
    console.error('Error in music API:', error);
    return NextResponse.json(
      { error: 'Failed to get music state' },
      { status: 500 }
    );
  }
}

// POST endpoint for controlling music
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, mood, volume } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'play':
        if (mood) {
          const tracksResult = getTracksForMood(mood);
          
          if ('error' in tracksResult) {
            return NextResponse.json(
              { error: tracksResult.error },
              { status: 400 }
            );
          }
          
          // Select 3 random tracks for the playlist
          const playlist: Track[] = [];
          const trackIndices = new Set<number>();
          
          while (trackIndices.size < 3 && trackIndices.size < tracksResult.length) {
            trackIndices.add(randomInt(0, tracksResult.length - 1));
          }
          
          trackIndices.forEach(index => {
            playlist.push(tracksResult[index]);
          });
          
          // Start playing
          currentMusic = {
            isPlaying: true,
            currentTrack: playlist.shift() || null,
            currentMood: mood,
            playlist: playlist,
            volume: volume || currentMusic.volume,
            startTime: new Date().toISOString(),
            position: 0
          };
          
          return NextResponse.json({
            status: 'success',
            message: `Playing music for mood: ${mood}`,
            data: currentMusic
          });
        } else if (currentMusic.currentTrack) {
          // Resume playback
          currentMusic.isPlaying = true;
          currentMusic.startTime = new Date().toISOString();
          
          return NextResponse.json({
            status: 'success',
            message: 'Resumed playback',
            data: currentMusic
          });
        } else {
          return NextResponse.json(
            { error: 'No track selected. Specify a mood.' },
            { status: 400 }
          );
        }
        
      case 'pause':
        if (currentMusic.isPlaying) {
          // Update position before pausing
          const now = new Date();
          const elapsed = (now.getTime() - new Date(currentMusic.startTime || '').getTime()) / 1000;
          currentMusic.position = Math.min(
            elapsed, 
            currentMusic.currentTrack ? currentMusic.currentTrack.duration : 0
          );
          
          currentMusic.isPlaying = false;
          
          return NextResponse.json({
            status: 'success',
            message: 'Playback paused',
            data: currentMusic
          });
        } else {
          return NextResponse.json({
            status: 'success',
            message: 'Already paused',
            data: currentMusic
          });
        }
        
      case 'stop':
        currentMusic = {
          isPlaying: false,
          currentTrack: null,
          currentMood: null,
          playlist: [],
          volume: currentMusic.volume,
          startTime: null,
          position: 0
        };
        
        return NextResponse.json({
          status: 'success',
          message: 'Playback stopped',
          data: currentMusic
        });
        
      case 'next':
        if (currentMusic.playlist.length > 0) {
          currentMusic.currentTrack = currentMusic.playlist.shift() || null;
          currentMusic.startTime = new Date().toISOString();
          currentMusic.position = 0;
          
          // Add a new track to playlist to keep it populated
          if (currentMusic.currentMood) {
            const tracksResult = getTracksForMood(currentMusic.currentMood);
            if (!('error' in tracksResult)) {
              const randomTrack = tracksResult[randomInt(0, tracksResult.length - 1)];
              currentMusic.playlist.push(randomTrack);
            }
          }
          
          return NextResponse.json({
            status: 'success',
            message: 'Skipped to next track',
            data: currentMusic
          });
        } else {
          return NextResponse.json(
            { error: 'No more tracks in playlist' },
            { status: 400 }
          );
        }
        
      case 'volume':
        if (typeof volume === 'number' && volume >= 0 && volume <= 100) {
          currentMusic.volume = volume;
          
          return NextResponse.json({
            status: 'success',
            message: `Volume set to ${volume}%`,
            data: currentMusic
          });
        } else {
          return NextResponse.json(
            { error: 'Volume must be a number between 0 and 100' },
            { status: 400 }
          );
        }
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling music:', error);
    return NextResponse.json(
      { error: 'Failed to control music' },
      { status: 500 }
    );
  }
} 