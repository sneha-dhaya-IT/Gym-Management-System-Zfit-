"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, ArrowLeft, CalendarDays } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getMemberOrders, Order } from "@/lib/api/orderApi"

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    if (!user?._id) return
    
    try {
      setLoading(true)
      setError(null)
      const fetchedOrders = await getMemberOrders(user._id)
      setOrders(fetchedOrders)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user?._id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/memberDashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground">Track your recent purchases and order history</p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading your orders...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Orders</h3>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <Button onClick={fetchOrders}>Try Again</Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              You haven&apos;t placed any orders yet. Start shopping to see your order history here.
            </p>
            <Button asChild>
              <Link href="/memberDashboard/store">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Start Shopping
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order History ({orders.length} orders)
              </CardTitle>
            </CardHeader>
          </Card>
          
          {orders.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order._id.slice(-8)}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Items Ordered:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-lg">Rs. {order.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}