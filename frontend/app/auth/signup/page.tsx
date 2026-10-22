import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-black px-4">
        <SignupForm />
      </div>
    </div>
  )
}