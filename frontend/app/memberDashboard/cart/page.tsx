"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  ArrowLeft,
  CreditCard
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cartApi, type Cart, type CartItem } from '@/lib/api/cartApi'
import { initiatePayHerePayment, type PayHerePaymentRequest } from '@/lib/api/paymentApi'

export default function CartPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  const fetchCart = useCallback(async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      setError('')
      const response = await cartApi.getCartByMember(user._id)
      setCart(response.data)
    } catch (error) {
      console.error('Error fetching cart:', error)
      setError('Failed to load cart')
      // Create empty cart state for display
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (!user?._id || !cart) return

    if (newQuantity < 1) {
      await removeItem(itemId)
      return
    }

    try {
      setUpdating(itemId)
      const response = await cartApi.updateCartItem(user._id, itemId, { quantity: newQuantity })
      setCart(response.data)
    } catch (error) {
      console.error('Error updating cart item:', error)
      setError('Failed to update item quantity')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!user?._id || !cart) return

    try {
      setUpdating(itemId)
      const response = await cartApi.removeCartItem(user._id, itemId)
      setCart(response.data)
    } catch (error) {
      console.error('Error removing cart item:', error)
      setError('Failed to remove item from cart')
    } finally {
      setUpdating(null)
    }
  }

  const clearCart = async () => {
    if (!user?._id || !cart) return

    try {
      setLoading(true)
      await cartApi.clearCart(user._id)
      setCart(null)
    } catch (error) {
      console.error('Error clearing cart:', error)
      setError('Failed to clear cart')
    } finally {
      setLoading(false)
    }
  }

  const getTotalItems = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => total + ((item.itemId.price || 0) * item.quantity), 0)
  }

  const handleCheckout = async () => {
    if (!cart?.items || cart.items.length === 0 || !user) return

    setLoading(true)
    setError('')

    try {
      // Prepare PayHere payment request
      const nameParts = (user.name || 'Customer').split(' ')
      const paymentRequest: PayHerePaymentRequest = {
        userId: user._id,
        amount: getTotalPrice(),
        currency: 'LKR',
        type: 'other' as const,
        relatedId: '', // Cart payments don't have a single related ID
        description: `Purchase of ${getTotalItems()} items from ZFit Store`,
        customerFirstName: nameParts[0] || 'Customer',
        customerLastName: nameParts.slice(1).join(' ') || 'User',
        customerEmail: user.email || 'customer@example.com',
        customerPhone: user.contactNo || '0000000000',
        customerAddress: user.profile?.address || 'No address provided',
        customerCity: 'Colombo', // Default city
      }

      console.log('Initiating PayHere cart payment:', paymentRequest)

      const response = await initiatePayHerePayment(paymentRequest)

      if (response.paymentForm) {
        console.log('Payment form received, submitting...')

        // Create form in current window and submit immediately
        const formContainer = document.createElement('div')
        formContainer.innerHTML = response.paymentForm
        document.body.appendChild(formContainer)

        // Find the form and submit it manually
        const paymentForm = document.getElementById('payhere-form') as HTMLFormElement
        if (paymentForm) {
          setTimeout(() => {
            paymentForm.submit()
          }, 100)
        } else {
          throw new Error('Payment form element not found')
        }
      } else {
        throw new Error('Payment form not received')
      }
    } catch (err) {
      console.error('Payment initiation failed:', err)
      setError(err instanceof Error ? err.message : 'Payment initiation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isOutOfStock = (item: CartItem) => {
    return (item.itemId.stock || 0) === 0
  }

  const getMaxQuantity = (item: CartItem) => {
    return item.itemId.stock || 0
  }

  const getAvailableStock = (item: CartItem) => {
    const totalStock = item.itemId.stock || 0
    const currentQuantity = item.quantity || 0
    return Math.max(0, totalStock - currentQuantity)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/memberDashboard/store')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Shopping Cart</h2>
            <p className="text-muted-foreground">
              {cart?.items?.length ? `${getTotalItems()} items in your cart` : 'Your cart is empty'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cart?.items && cart.items.length > 0 && (
            <Button onClick={clearCart} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Cart Content */}
      {!cart?.items || cart.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground text-center mb-6">
              Browse our store and add items to your cart.
            </p>
            <Button onClick={() => router.push('/memberDashboard/store')}>
              <Package className="w-4 h-4 mr-2" />
              Browse Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item._id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Item Image Placeholder */}
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {item.itemId.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {typeof item.itemId.categoryID === 'object' ? item.itemId.categoryID.name : 'No category'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Available: {getAvailableStock(item)} / Total: {item.itemId.stock || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold text-primary">
                          LKR {(item.itemId.price || 0).toFixed(2)}
                        </p>
                        {typeof item.itemId.supplierID === 'object' && item.itemId.supplierID && (
                          <Badge variant="secondary" className="text-xs">
                            {item.itemId.supplierID.supplierName}
                          </Badge>
                        )}
                        {isOutOfStock(item) && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.itemId._id, item.quantity - 1)}
                        disabled={updating === item.itemId._id || item.quantity <= 1}
                        title="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-12 text-center font-medium">
                        {updating === item.itemId._id ? '...' : item.quantity}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.itemId._id, item.quantity + 1)}
                        disabled={updating === item.itemId._id || item.quantity >= getMaxQuantity(item) || isOutOfStock(item)}
                        title={`Increase quantity (Max: ${getMaxQuantity(item)})`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Item Total & Remove */}
                    <div className="text-right">
                      <p className="text-lg font-bold mb-2">
                        LKR {((item.itemId.price || 0) * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.itemId._id)}
                        disabled={updating === item.itemId._id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stock Warning */}
                  {item.quantity > getMaxQuantity(item) && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Only {getMaxQuantity(item)} items available in stock
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Items ({getTotalItems()})</span>
                    <span className="text-sm">LKR {getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Shipping</span>
                    <span className="text-sm">Free</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-lg font-bold text-primary">
                        LKR {getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!cart?.items || cart.items.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/memberDashboard/store')}
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}