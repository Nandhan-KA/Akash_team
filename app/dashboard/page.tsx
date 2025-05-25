import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Activity, AlertTriangle, Phone, Heart, SirenIcon as SosIcon, BarChart3 } from "lucide-react"
import { DrowsinessMonitor } from "@/components/drowsiness-monitor"
import { EmotionDisplay } from "@/components/emotion-display"
import { PhoneDetection } from "@/components/phone-detection"
import { HeartRateMonitor } from "@/components/heart-rate-monitor"
import { MusicPlayer } from "@/components/music-player"
import { AlertHistory } from "@/components/alert-history"
import { SOSAlert } from "@/components/sos-alert"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Driver Monitoring Dashboard
          </h1>
          <SOSAlert />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Drowsiness Level</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">Low</div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Last blink detected 2s ago</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Current Emotion
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">Neutral</div>
              <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">Confidence: 87%</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300">Heart Rate</CardTitle>
              <Heart className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">72 BPM</div>
              <p className="text-xs text-pink-600/70 dark:text-pink-400/70">Normal range</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Phone Detection</CardTitle>
              <Phone className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">Not Detected</div>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">Last detected 2h ago</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="monitor" className="space-y-4">
          <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-md">
            <TabsTrigger
              value="monitor"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              Live Monitor
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              Statistics
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              Alert History
            </TabsTrigger>
            <TabsTrigger
              value="music"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              Music Player
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1 border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardTitle>Drowsiness Monitor</CardTitle>
                  <CardDescription className="text-blue-100">
                    Real-time eye tracking and drowsiness detection
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 bg-white dark:bg-gray-900">
                  <DrowsinessMonitor />
                </CardContent>
              </Card>

              <Card className="col-span-1 border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                  <CardTitle>Emotion Recognition</CardTitle>
                  <CardDescription className="text-yellow-100">Real-time facial expression analysis</CardDescription>
                </CardHeader>
                <CardContent className="p-4 bg-white dark:bg-gray-900">
                  <EmotionDisplay />
                </CardContent>
              </Card>

              <Card className="col-span-1 border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                  <CardTitle>Phone Detection</CardTitle>
                  <CardDescription className="text-red-100">TensorFlow.js-based phone detection</CardDescription>
                </CardHeader>
                <CardContent className="p-4 bg-white dark:bg-gray-900">
                  <PhoneDetection />
                </CardContent>
              </Card>

              <Card className="col-span-1 border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
                  <CardTitle>Heart Rate Monitor</CardTitle>
                  <CardDescription className="text-pink-100">Real-time heart rate estimation</CardDescription>
                </CardHeader>
                <CardContent className="p-4 bg-white dark:bg-gray-900">
                  <HeartRateMonitor />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardTitle>System Statistics</CardTitle>
                <CardDescription className="text-purple-100">
                  Performance metrics and detection statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-white dark:bg-gray-900">
                <div className="h-[300px] flex items-center justify-center border rounded-md bg-gray-50 dark:bg-gray-800">
                  <div className="flex flex-col items-center gap-2">
                    <BarChart3 className="h-8 w-8 text-purple-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Statistics visualization will appear here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardTitle>Alert History</CardTitle>
                <CardDescription className="text-orange-100">Recent alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="p-4 bg-white dark:bg-gray-900">
                <AlertHistory />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardTitle>Music Player</CardTitle>
                <CardDescription className="text-green-100">Mood-based music selection</CardDescription>
              </CardHeader>
              <CardContent className="p-4 bg-white dark:bg-gray-900">
                <MusicPlayer />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
