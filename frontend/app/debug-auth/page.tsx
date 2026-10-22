"use client"

import { AuthDebug } from "@/components/AuthDebug"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugAuthPage() {
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = "/auth/login"
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-[#202022] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Authentication Debug Page</CardTitle>
          </CardHeader>
          <CardContent>
            <AuthDebug />
          </CardContent>
        </Card>

        <Card className="bg-[#202022] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </Button>
            
            <div className="text-sm text-gray-400">
              <p>If you're seeing "Access Denied" errors:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Make sure you're logged in with a Manager or Staff account</li>
                <li>Check that your user role is correctly set in the database</li>
                <li>Try logging out and logging back in</li>
                <li>Clear your browser's localStorage and cookies</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#202022] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => window.location.href = "/dashboard/reservations"}
              className="w-full bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
            >
              Go to Reservations
            </Button>
            <Button 
              onClick={() => window.location.href = "/dashboard/reservations/classes"}
              className="w-full bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
            >
              Go to Classes Management
            </Button>
            <Button 
              onClick={() => window.location.href = "/auth/login"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
