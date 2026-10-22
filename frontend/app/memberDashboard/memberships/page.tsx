"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Search, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function MembershipsIndexPage() {
  const router = useRouter()

  // Redirect to my-memberships by default after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/memberDashboard/memberships/my-memberships')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CreditCard className="h-16 w-16 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Memberships
          </CardTitle>
          <CardDescription>
            Manage your gym memberships and explore new plans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Redirecting to your memberships...
          </div>
          
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/memberDashboard/memberships/my-memberships">
                <CreditCard className="w-4 h-4 mr-2" />
                My Memberships
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/memberDashboard/memberships/browse">
                <Search className="w-4 h-4 mr-2" />
                Browse Plans
              </Link>
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link href="/memberDashboard">
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}