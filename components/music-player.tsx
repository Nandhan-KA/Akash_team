"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Smile, Frown, Meh, Angry } from "lucide-react"

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState({
    title: "Relaxing Melody",
    artist: "Mood Music",
    duration: 180,
    mood: "neutral",
  })
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(70)
  const [currentMood, setCurrentMood] = useState("neutral")
  const [playlist, setPlaylist] = useState([
    { title: "Happy Vibes", artist: "Mood Music", duration: 210, mood: "happy" },
    { title: "Calm Waters", artist: "Relaxation", duration: 195, mood: "neutral" },
    { title: "Energy Boost", artist: "Wake Up", duration: 165, mood: "happy" },
    { title: "Melancholy", artist: "Deep Thoughts", duration: 220, mood: "sad" },
    { title: "Focus Time", artist: "Concentration", duration: 240, mood: "neutral" },
    { title: "Tension Release", artist: "Let Go", duration: 185, mood: "angry" },
  ])

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Move to next track
            handleSkipForward()
            return 0
          }
          return prev + (100 / currentTrack.duration) * 0.5
        })
      }, 500)
    }

    return () => clearInterval(interval)
  }, [isPlaying, currentTrack])

  // Simulate mood changes
  useEffect(() => {
    const interval = setInterval(() => {
      const moods = ["happy", "sad", "angry", "neutral"]
      const newMood = moods[Math.floor(Math.random() * moods.length)]
      setCurrentMood(newMood)

      // Suggest tracks based on mood
      const moodTracks = playlist.filter((track) => track.mood === newMood)
      if (moodTracks.length > 0 && Math.random() > 0.7) {
        // Occasionally suggest a track change
        setCurrentTrack(moodTracks[Math.floor(Math.random() * moodTracks.length)])
        setProgress(0)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [playlist])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSkipForward = () => {
    const currentIndex = playlist.findIndex(
      (track) => track.title === currentTrack.title && track.artist === currentTrack.artist,
    )
    const nextIndex = (currentIndex + 1) % playlist.length
    setCurrentTrack(playlist[nextIndex])
    setProgress(0)
  }

  const handleSkipBack = () => {
    const currentIndex = playlist.findIndex(
      (track) => track.title === currentTrack.title && track.artist === currentTrack.artist,
    )
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length
    setCurrentTrack(playlist[prevIndex])
    setProgress(0)
  }

  // Get mood icon
  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "happy":
        return <Smile className="h-5 w-5 text-green-500" />
      case "sad":
        return <Frown className="h-5 w-5 text-blue-500" />
      case "angry":
        return <Angry className="h-5 w-5 text-red-500" />
      case "neutral":
      default:
        return <Meh className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-purple-700 dark:text-purple-300">{currentTrack.title}</h3>
              <p className="text-sm text-purple-600/70 dark:text-purple-400/70">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center">
              <span className="text-sm mr-2 text-purple-600 dark:text-purple-400">Current Mood:</span>
              {getMoodIcon(currentMood)}
            </div>
          </div>

          <div className="mb-4">
            <Slider
              value={[progress]}
              max={100}
              step={1}
              className="cursor-pointer"
              onValueChange={(value) => setProgress(value[0])}
            />
            <div className="flex justify-between text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
              <span>{formatTime((progress / 100) * currentTrack.duration)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSkipBack}
              className="h-10 w-10 rounded-full border-purple-300 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 dark:border-purple-700"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSkipForward}
              className="h-10 w-10 rounded-full border-purple-300 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 dark:border-purple-700"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center mt-4">
            <Volume2 className="h-4 w-4 mr-2 text-purple-500" />
            <Slider
              value={[volume]}
              max={100}
              step={1}
              className="cursor-pointer"
              onValueChange={(value) => setVolume(value[0])}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-2 text-purple-600 dark:text-purple-400">Mood-Based Playlist</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {playlist.map((track, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors ${
                  currentTrack.title === track.title ? "bg-purple-100 dark:bg-purple-900/50" : ""
                }`}
                onClick={() => {
                  setCurrentTrack(track)
                  setProgress(0)
                  setIsPlaying(true)
                }}
              >
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      track.mood === "happy"
                        ? "bg-green-100 text-green-500 dark:bg-green-900/50"
                        : track.mood === "sad"
                          ? "bg-blue-100 text-blue-500 dark:bg-blue-900/50"
                          : track.mood === "angry"
                            ? "bg-red-100 text-red-500 dark:bg-red-900/50"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}
                  >
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{track.title}</p>
                    <p className="text-xs text-gray-500">{track.artist}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {getMoodIcon(track.mood)}
                  <span className="text-xs text-gray-500 ml-2">{formatTime(track.duration)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to format time in MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
