"use client"

export default function EmailVerificationPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-[#1A1A1A] rounded-lg p-12 border border-gray-800">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-3">Please verify your email</h1>
            <p className="text-xl text-gray-400">You are almost there.</p>
          </div>

          {/* Content Section */}
          <div className="text-center mb-16">
            <p className="text-gray-300 text-base leading-relaxed">
              We have sent you an email. Just click on the link in the email to complete your sign up.
              If you don&apos;t see it, you may need to check your spam folder.
            </p>
          </div>

          {/* Actions Section */}
          <div className="space-y-6">
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-md transition-colors"
            >
              Back to Login
            </button>

            <div className="text-center">
              <p className="text-gray-500 text-sm">
                Didn&apos;t receive the email?{" "}
                <button className="text-gray-400 hover:text-gray-200 underline font-medium">
                  Resend verification email
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}