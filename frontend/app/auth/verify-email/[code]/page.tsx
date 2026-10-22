"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

export default function EmailVerificationPage() {
  const params = useParams()
  const code = params.code as string

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/email/verify/${code}`, {
          method: 'GET',
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Your email has been successfully verified!')
        } else {
          setStatus('error')
          setMessage(data.message || 'Failed to verify email. The link may be invalid or expired.')
        }
      } catch {
        setStatus('error')
        setMessage('Network error. Please try again later.')
      }
    }

    if (code) {
      verifyEmail()
    }
  }, [code])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
        <div className="w-full max-w-lg mx-auto">
          <div className="bg-[#1A1A1A] rounded-lg p-12 border border-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-white mb-2">Verifying your email...</h1>
              <p className="text-gray-400">Please wait while we verify your email address.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-[#1A1A1A] rounded-lg p-12 border border-gray-800">
          {/* Status Icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              {status === 'success' ? (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              {status === 'success' ? 'Email Verified!' : 'Verification Failed'}
            </h1>
          </div>

          {/* Message */}
          <div className="text-center mb-12">
            <p className="text-gray-300 text-base leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-md transition-colors"
            >
              {status === 'success' ? 'Continue to Login' : 'Back to Login'}
            </button>

            {status === 'error' && (
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  Need help?{" "}
                  <button className="text-gray-400 hover:text-gray-200 underline">
                    Contact Support
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}