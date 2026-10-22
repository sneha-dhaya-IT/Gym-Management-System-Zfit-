"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle different error types
        if (response.status === 401) {
          setError("Invalid email or password")
        } else if (response.status === 400) {
          setError(data.message || "Please check your input")
        } else if (response.status === 429) {
          setError("Too many login attempts. Please try again later.")
        } else {
          setError(data.message || "Login failed. Please try again.")
        }
        return
      }

      // Success - handle login
      console.log("Login successful:", data)

      // Store user data and token in auth context
      login(data.token || 'dummy-token', data.user)

      // Redirect based on user role
      if (data.user?.role === 'member') {
        router.push("/memberDashboard")
      } else {
        // staff or manager
        router.push("/dashboard")
      }

    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 text-left">Welcome Back!</h1>
        <p className="text-gray-400 text-left">Welcome back! Please enter your details.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <div>
          <Label htmlFor="email" className="text-gray-300 block mb-3">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
            <Input
              id="email"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
              required
              disabled={isLoading}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="password" className="text-gray-300 block mb-3">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-10 pr-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-4 text-gray-500 hover:text-gray-400"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full px-8 py-5 bg-white hover:bg-gray-100 text-black border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? "Logging In..." : "Log In"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <Link href="/auth/forgot-password" className="text-gray-400 hover:text-gray-200 text-sm font-medium">
          Forgot Password?
        </Link>
      </div>
      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-gray-400 hover:text-gray-200 underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}