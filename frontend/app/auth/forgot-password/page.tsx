import { ForgotPasswordForm } from "@/components/forgot-password-form"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-black px-4">
        <ForgotPasswordForm />
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