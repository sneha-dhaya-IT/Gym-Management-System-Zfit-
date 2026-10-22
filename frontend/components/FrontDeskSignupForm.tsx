"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, Check, X, MapPin } from "lucide-react"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  contactNo: z.string()
    .min(1, "Phone number is required")
    .regex(/^(?:\+94|0)[1-9]\d{8}$/, "Enter a valid Sri Lankan Phone number"),
  dob: z.string().optional(),
  profile: z.object({
    address: z.string().optional(),
    emergencyContact: z.string().optional()
  }).optional(),
  consent: z.object({
    gdpr: z.boolean(),
    marketing: z.boolean(),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.consent.gdpr === true, {
  message: "You must accept the GDPR terms",
  path: ["gdpr"],
})

type SignupFormData = z.infer<typeof signupSchema>

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
}

export function FrontDeskSignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isVerificationStep, setIsVerificationStep] = useState(false)
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNo: "",
    dob: "",
    profile: {
      address: "",
      emergencyContact: "",
    },
    consent: {
      gdpr: false,
      marketing: false,
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const getPasswordStrength = (password: string): PasswordStrength => {
    const checks = [
      { regex: /.{8,}/, message: "At least 8 characters" },
      { regex: /[A-Z]/, message: "One uppercase letter" },
      { regex: /[a-z]/, message: "One lowercase letter" },
      { regex: /[0-9]/, message: "One number" },
      { regex: /[^A-Za-z0-9]/, message: "One special character" },
    ]

    const passedChecks = checks.filter(check => check.regex.test(password))
    const score = passedChecks.length

    let color = "text-red-400"
    if (score >= 4) color = "text-yellow-400"
    if (score >= 5) color = "text-gray-400"

    return {
      score,
      feedback: checks.map(check => check.message),
      color,
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleInputChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => {
      if (field === "profile") {
        return {
          ...prev,
          profile: value as SignupFormData["profile"]
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    if (fieldErrors[field as string]) {
      setFieldErrors(prev => ({ ...prev, [field as string]: "" }))
    }
  }

  const handleProfileChange = (field: "address" | "emergencyContact", value: string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleConsentChange = (field: "gdpr" | "marketing", value: boolean) => {
    setFormData(prev => ({
      ...prev,
      consent: {
        ...prev.consent,
        [field]: value
      }
    }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "") // Only allow digits
    handleInputChange("contactNo", value)
  }

  const validateStep1 = () => {
    const step1Schema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain uppercase letter")
        .regex(/[a-z]/, "Must contain lowercase letter")
        .regex(/[0-9]/, "Must contain number")
        .regex(/[^A-Za-z0-9]/, "Must contain special character"),
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })

    try {
      step1Schema.parse({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })
      setFieldErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message
          }
        })
        setFieldErrors(errors)
      }
      return false
    }
  }

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    try {
      const validatedData = signupSchema.parse(formData)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: validatedData.name,
          email: validatedData.email,
          password: validatedData.password,
          confirmPassword: validatedData.confirmPassword,
          contactNo: validatedData.contactNo,
          dob: validatedData.dob || undefined,
          profile: validatedData.profile ? {
            address: validatedData.profile.address || undefined,
            emergencyContact: validatedData.profile.emergencyContact || undefined,
          } : undefined,
          consent: validatedData.consent,
          role: "member",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          setError(data.message || "Please check your input")
        } else if (response.status === 409) {
          setError("Email already exists")
        } else {
          setError(data.message || "Registration failed. Please try again.")
        }
        return
      }

      // Success - show verification message in modal
      setIsVerificationStep(true)

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message
          }
        })
        setFieldErrors(errors)
      } else {
        console.error("Registration error:", error)
        setError("Network error. Please check your connection and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {!isVerificationStep && currentStep === 1 && (
        <form className="space-y-8">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="name" className="text-gray-300 block mb-3">Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
              <Input
                id="name"
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="h-12 pl-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                required
                disabled={isLoading}
              />
            </div>
            {fieldErrors.name && <p className="text-red-400 text-sm mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-300 block mb-3">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-12 pl-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                required
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="password" className="text-gray-300 block mb-3">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
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
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score === 0 ? "bg-gray-600" :
                          passwordStrength.score <= 2 ? "bg-red-500" :
                          passwordStrength.score <= 4 ? "bg-yellow-500" : "bg-gray-400"
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${passwordStrength.color}`}>
                      {passwordStrength.score}/5
                    </span>
                  </div>
                  <div className="space-y-1">
                    {passwordStrength.feedback.map((hint, index) => {
                      const isMet = [
                        /.{8,}/.test(formData.password),
                        /[A-Z]/.test(formData.password),
                        /[a-z]/.test(formData.password),
                        /[0-9]/.test(formData.password),
                        /[^A-Za-z0-9]/.test(formData.password),
                      ][index]

                      return (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          {isMet ? (
                            <Check className="h-3 w-3 text-gray-400" />
                          ) : (
                            <X className="h-3 w-3 text-red-400" />
                          )}
                          <span className={isMet ? "text-gray-400" : "text-gray-400"}>
                            {hint}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {fieldErrors.password && <p className="text-red-400 text-sm mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300 block mb-3">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
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
              {fieldErrors.confirmPassword && <p className="text-red-400 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleNext}
            className="w-full px-8 py-5 bg-white hover:bg-gray-100 text-black border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Next
          </Button>
        </form>
      )}

      {!isVerificationStep && currentStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="contactNo" className="text-gray-300 block mb-3">Contact No *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="contactNo"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={formData.contactNo}
                  onChange={handlePhoneInput}
                  className="h-12 pl-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                  required
                  disabled={isLoading}
                  maxLength={10}
                />
              </div>
              {fieldErrors.contactNo && <p className="text-red-400 text-sm mt-1">{fieldErrors.contactNo}</p>}
            </div>

            <div>
              <Label htmlFor="dob" className="text-gray-300 block mb-3">Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  className="h-12 pl-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.dob && <p className="text-red-400 text-sm mt-1">{fieldErrors.dob}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-gray-300 block mb-3">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
              <Input
                id="address"
                type="text"
                placeholder="Your Address"
                value={formData.profile?.address || ""}
                onChange={(e) => handleProfileChange("address", e.target.value)}
                className="h-12 pl-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="emergencyContact" className="text-gray-300 block mb-3">Emergency Contact</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
              <Input
                id="emergencyContact"
                type="tel"
                placeholder="Emergency Contact Number"
                value={formData.profile?.emergencyContact || ""}
                onChange={(e) => handleProfileChange("emergencyContact", e.target.value.replace(/\D/g, ""))}
                className="h-12 pl-10 bg-[#202022] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                disabled={isLoading}
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="gdpr"
                checked={formData.consent.gdpr}
                onCheckedChange={(checked) => handleConsentChange("gdpr", checked as boolean)}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="gdpr" className="text-gray-300 text-sm cursor-pointer">
                  I agree to the{" "}
                  <span className="text-gray-400 underline">Terms and Conditions</span>{" "}
                  and{" "}
                  <span className="text-gray-400 underline">Privacy Policy</span>
                </Label>
              </div>
            </div>
            {fieldErrors.gdpr && <p className="text-red-400 text-sm">{fieldErrors.gdpr}</p>}

            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing"
                checked={formData.consent.marketing}
                onCheckedChange={(checked) => handleConsentChange("marketing", checked as boolean)}
                disabled={isLoading}
                className="mt-1"
              />
              <Label htmlFor="marketing" className="text-gray-300 text-sm cursor-pointer">
                I would like to receive marketing communications and updates
              </Label>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              onClick={handleBack}
              className="flex-1 px-8 py-5 bg-gray-600 hover:bg-gray-500 text-white border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 px-8 py-5 bg-white hover:bg-gray-100 text-black border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </div>
        </form>
      )}

      {isVerificationStep && (
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Please verify your email</h2>
            <h3 className="text-xl font-semibold text-[#AAFF69]">You are almost there.</h3>
          </div>

          <div className="space-y-4 text-gray-300">
            <p className="text-lg">
              We have sent you an email. Just click on the link in the email to complete your sign up.
            </p>
            <p className="text-base">
              If you don&apos;t see it, you may need to check your spam folder.
            </p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-400">
              Please check your email and click the verification link to complete your registration.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}