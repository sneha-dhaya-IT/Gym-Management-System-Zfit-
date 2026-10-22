"use client"

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  ShoppingBag, 
  ShoppingCart, 
  Calendar, 
  User,
  ArrowRight 
} from 'lucide-react'
import { useAuth } from "@/lib/auth-context"

export default function MemberDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  const quickActions = [
    {
      title: "My Memberships",
      description: "View and manage your gym memberships",
      icon: Users,
      href: "/memberDashboard/memberships/my-memberships",
      color: "text-blue-500"
    },
    {
      title: "Reservations",
      description: "Book, view, and manage your class reservations",
      icon: Calendar,
      href: "/memberDashboard/reservations",
      color: "text-emerald-500"
    },
    {
      title: "Browse Store",
      description: "Shop for supplements and equipment",
      icon: ShoppingBag,
      href: "/memberDashboard/store",
      color: "text-green-500"
    },
    {
      title: "Shopping Cart",
      description: "View and manage your cart items",
      icon: ShoppingCart,
      href: "/memberDashboard/cart",
      color: "text-orange-500"
    },
    {
      title: "Attendance",
      description: "Check your gym attendance record",
      icon: Calendar,
      href: "/memberDashboard/attendance",
      color: "text-purple-500"
    },
    {
      title: "My Profile",
      description: "Update your personal information",
      icon: User,
      href: "/memberDashboard/profile",
      color: "text-pink-500"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] || 'Member'}!
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s your quick access to important features.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => {
          const IconComponent = action.icon
          return (
            <Card key={action.title} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${action.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  {action.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {action.description}
                </p>
                <Button 
                  onClick={() => router.push(action.href)}
                  variant="outline" 
                  size="sm"
                  className="w-full justify-between"
                >
                  Go to {action.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your recent gym activities will appear here.</p>
        </CardContent>
      </Card>
    </div>
  )
}