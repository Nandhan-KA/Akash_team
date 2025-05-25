import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Activity, AlertTriangle, Music, Phone, Heart, SirenIcon as SosIcon, Shield, Eye, Brain } from "lucide-react"
import { SOSAlert } from "@/components/sos-alert"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/80 dark:border-gray-800">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                <Shield className="h-8 w-8 text-white absolute inset-0 p-1.5" />
              </div>
              <span className="hidden font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 sm:inline-block">
                Driver Monitoring System
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                Dashboard
              </Link>
              <Link href="/alerts" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                Alerts
              </Link>
              <Link href="/settings" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                Settings
              </Link>
              <Link href="/history" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                History
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <SOSAlert />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-8 md:py-16 lg:py-24 xl:py-32 bg-gradient-to-b from-blue-50 via-purple-50 to-white dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full animate-pulse delay-1000"></div>
          </div>
          
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600 animate-gradient">
                  Keeping Drivers Safe <br />
                  <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">with AI-Powered Monitoring</span>
                </h1>
                <p className="mx-auto max-w-[800px] text-gray-600 md:text-xl lg:text-2xl dark:text-gray-300">
                  Advanced real-time monitoring system that prevents accidents by detecting drowsiness, emotions, and distractions
                </p>
              </div>
              
              <div className="flex justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg text-lg px-8">
                    Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="flex items-center justify-center space-x-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <Eye className="h-8 w-8 text-blue-500" />
                  <p className="text-lg font-medium">Drowsiness Detection</p>
                </div>
                <div className="flex items-center justify-center space-x-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <Brain className="h-8 w-8 text-purple-500" />
                  <p className="text-lg font-medium">Emotion Recognition</p>
                </div>
                <div className="flex items-center justify-center space-x-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <Phone className="h-8 w-8 text-red-500" />
                  <p className="text-lg font-medium">Phone Detection</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Comprehensive Monitoring Features
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Our system provides a complete suite of driver monitoring capabilities
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
              <Card className="overflow-hidden border-none shadow-lg transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-full opacity-20"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
                    <Activity className="mr-2 h-5 w-5 text-blue-500" />
                    Drowsiness Detection
                  </CardTitle>
                  <CardDescription>Real-time eye tracking and blink detection</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Monitors eye aspect ratio, head pose, and yawning to detect drowsiness and prevent accidents.</p>
                  <Link href="/features/drowsiness">
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                    >
                      Learn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-lg transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-bl-full opacity-20"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-300">
                    <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                    Emotion Recognition
                  </CardTitle>
                  <CardDescription>Deep learning-based emotion classification</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Analyzes facial expressions in real-time to detect emotions like happy, sad, angry, and neutral.
                  </p>
                  <Link href="/features/emotion">
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/50"
                    >
                      Learn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-lg transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-bl-full opacity-20"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-700 dark:text-red-300">
                    <Phone className="mr-2 h-5 w-5 text-red-500" />
                    Phone Usage Detection
                  </CardTitle>
                  <CardDescription>YOLOv5-based object detection</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Detects phone usage while driving and provides timely warnings to prevent distracted driving.</p>
                  <Link href="/features/phone">
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
                    >
                      Learn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-lg transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-bl-full opacity-20"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-pink-700 dark:text-pink-300">
                    <Heart className="mr-2 h-5 w-5 text-pink-500" />
                    Heart Rate Monitoring
                  </CardTitle>
                  <CardDescription>Real-time heart rate estimation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Monitors heart rate to detect stress levels and provides alerts for abnormal heart rates.</p>
                  <Link href="/features/heart-rate">
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-pink-500 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/50"
                    >
                      Learn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-lg transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-bl-full opacity-20"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
                    <SosIcon className="mr-2 h-5 w-5 text-orange-500" />
                    SOS Alert System
                  </CardTitle>
                  <CardDescription>Emergency contact notification</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Automatically shares GPS location and contacts emergency services when dangerous conditions are
                    detected.
                  </p>
                  <Link href="/features/sos">
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/50"
                    >
                      Learn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-lg transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-bl-full opacity-20"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700 dark:text-purple-300">
                    <Music className="mr-2 h-5 w-5 text-purple-500" />
                    Music Player System
                  </CardTitle>
                  <CardDescription>Mood-based music selection</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Selects music based on detected emotions and adjusts volume based on drowsiness levels.</p>
                  <Link href="/features/music">
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                    >
                      Learn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
                  Advanced Technology for Driver Safety
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Our system uses cutting-edge computer vision and machine learning algorithms to monitor driver state
                  and prevent accidents.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <p className="ml-3 text-gray-600 dark:text-gray-300">
                      Real-time drowsiness detection with eye tracking
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <p className="ml-3 text-gray-600 dark:text-gray-300">Emotion recognition to detect driver stress</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <p className="ml-3 text-gray-600 dark:text-gray-300">
                      Phone usage detection to prevent distracted driving
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <p className="ml-3 text-gray-600 dark:text-gray-300">Heart rate monitoring for health awareness</p>
                  </li>
                </ul>
                <Button className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  Learn More About Our Technology
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="text-center p-6">
                      <Activity className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Live Monitoring Dashboard
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Real-time visualization of driver state and vehicle conditions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:border-gray-800">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-600 dark:text-gray-300 md:text-left">
            © 2024 Driver Monitoring System. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
