"use client";

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { authApi } from "@/lib/api/authApi"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isValidLink, setIsValidLink] = useState<boolean | null>(null) // null = checking, true = valid, false = invalid

  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  useEffect(() => {
    // Validate the reset code with the backend first
    if (code) {
      const validateCode = async () => {
        try {
          setIsValidLink(null) // checking
          await authApi.validateResetCode(code)
          setIsValidLink(true) // valid
        } catch {
          // Don't log to console, just mark as invalid
          setIsValidLink(false) // invalid
        }
      }
      validateCode()
    } else {
      setIsValidLink(false)
    }
  }, [code])

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    }
  }

  const passwordValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!code) {
      setError("Invalid reset code")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!passwordValidation.isValid) {
      setError("Password does not meet requirements")
      return
    }

    setIsLoading(true)

    try {
      const response = await authApi.resetPassword(password, code)

      if (response.message) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } else {
        setError("Failed to reset password")
      }
    } catch (error: unknown) {
      console.error("Reset password error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

      // Provide user-friendly error messages
      if (errorMessage.includes("Network error") || errorMessage.includes("fetch")) {
        setError("Unable to connect to the server. Please check your internet connection and try again.")
      } else if (errorMessage.includes("Invalid or expired verification code")) {
        setError("This reset link has expired or is invalid. Please request a new password reset.")
      } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        setError("Invalid reset link. Please request a new password reset.")
      } else if (errorMessage.includes("500") || errorMessage.includes("Server error")) {
        setError("Server error occurred. Please try again later or contact support if the problem persists.")
      } else {
        setError(errorMessage || "Failed to reset password. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidLink === false) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-black px-4">
          <div className="w-full max-w-sm mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Link Expired</h1>
              <p className="text-gray-400">
                This password reset link is no longer valid. Please request a new one.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full px-8 py-5 bg-white hover:bg-gray-100 text-black border border-gray-300"
              >
                Request New Reset Link
              </Button>

              <Button
                onClick={() => router.push("/auth/login")}
                variant="outline"
                className="w-full px-8 py-5 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
        <div className="pb-8 text-center">
          <div className="flex justify-center space-x-6 text-xs">
            <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">
              Terms and Conditions
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while validating
  if (isValidLink === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-black px-4">
          <div className="w-full max-w-sm mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Validating Link...</h1>
              <p className="text-gray-400">
                Please wait while we validate your reset link.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-black px-4">
          <div className="w-full max-w-sm mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="h-16 w-16 text-[#AAFF69] mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-white mb-2">Password Reset!</h1>
              <p className="text-[#AAFF69]">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
            </div>

            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full px-8 py-5 bg-white hover:bg-gray-100 text-black border border-gray-300"
            >
              Continue to Login
            </Button>
          </div>
        </div>
        <div className="pb-8 text-center">
          <div className="flex justify-center space-x-6 text-xs">
            <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">
              Terms and Conditions
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-400">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-gray-300 block mb-3">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
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

              {/* Password requirements */}
              <div className="mt-3 space-y-1">
                <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-[#AAFF69]' : 'text-gray-500'}`}>
                  <div className={`w-1 h-1 rounded-full mr-2 ${passwordValidation.minLength ? 'bg-[#AAFF69]' : 'bg-gray-500'}`} />
                  At least 8 characters
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-[#AAFF69]' : 'text-gray-500'}`}>
                  <div className={`w-1 h-1 rounded-full mr-2 ${passwordValidation.hasUpperCase ? 'bg-[#AAFF69]' : 'bg-gray-500'}`} />
                  One uppercase letter
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-[#AAFF69]' : 'text-gray-500'}`}>
                  <div className={`w-1 h-1 rounded-full mr-2 ${passwordValidation.hasLowerCase ? 'bg-[#AAFF69]' : 'bg-gray-500'}`} />
                  One lowercase letter
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasNumbers ? 'text-[#AAFF69]' : 'text-gray-500'}`}>
                  <div className={`w-1 h-1 rounded-full mr-2 ${passwordValidation.hasNumbers ? 'bg-[#AAFF69]' : 'bg-gray-500'}`} />
                  One number
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-[#AAFF69]' : 'text-gray-500'}`}>
                  <div className={`w-1 h-1 rounded-full mr-2 ${passwordValidation.hasSpecialChar ? 'bg-[#AAFF69]' : 'bg-gray-500'}`} />
                  One special character
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300 block mb-3">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pl-10 pr-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-4 text-gray-500 hover:text-gray-400"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full px-8 py-5 bg-white hover:bg-gray-100 text-black border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-gray-400 hover:text-gray-200 text-sm font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
      <div className="pb-8 text-center">
        <div className="flex justify-center space-x-6 text-xs">
          <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">
            Terms and Conditions
          </Link>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}