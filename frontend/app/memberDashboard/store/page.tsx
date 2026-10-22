"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Search, Package, Store } from 'lucide-react'
import { itemApiService, type Item } from '@/lib/api/itemApi'
import { cartApi, type Cart } from '@/lib/api/cartApi'
import { useAuth } from '@/lib/auth-context'

type StoreItem = Item

export default function MemberStorePage() {
  const [items, setItems] = useState<StoreItem[]>([])
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const router = useRouter()
  const { user } = useAuth()

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await itemApiService.getItems()
      
      // Filter only sellable items
      const allItems = response.data as StoreItem[]
      const sellableItems = allItems.filter(item => 
        item.type === 'sellable' && item.isActive && item.stock && item.stock > 0
      )
      
      setItems(sellableItems)
    } catch (error) {
      console.error('Error fetching items:', error)
      setError('Failed to load store items')
    } finally {
      setLoading(false)
    }
  }

  const fetchCart = useCallback(async () => {
    if (!user?._id) return
    
    try {
      const response = await cartApi.getCartByMember(user._id)
      setCart(response.data)
    } catch (error) {
      console.error('Error fetching cart:', error)
      // Don't show error for cart fetch failure - just keep cart as null
    }
  }, [user?._id])

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    if (user?._id) {
      fetchCart()
    }
  }, [user?._id, fetchCart])

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    const supplierName = typeof item.supplierID === 'object' ? item.supplierID?.supplierName || '' : ''
    const categoryName = typeof item.categoryID === 'object' ? item.categoryID?.name || '' : ''
    
    return (
      item.name.toLowerCase().includes(searchLower) ||
      supplierName.toLowerCase().includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower)
    )
  })

  const addToCart = async (item: StoreItem) => {
    if (!user?._id) return
    
    try {
      setCartLoading(true)
      await cartApi.addToCart({
        memberId: user._id,
        itemId: item._id,
        quantity: 1
      })
      // Refresh cart after adding
      await fetchCart()
      console.log('Cart updated after adding item')
    } catch (error) {
      console.error('Error adding to cart:', error)
      setError('Failed to add item to cart')
    } finally {
      setCartLoading(false)
    }
  }

  const removeFromCart = async (itemId: string) => {
    if (!user?._id || !cart) return
    
    try {
      setCartLoading(true)
      
      // Find the item in cart to determine current quantity
      const cartItem = cart.items.find(item => item.itemId._id === itemId)
      if (!cartItem) return
      
      if (cartItem.quantity > 1) {
        // Update quantity if more than 1
        await cartApi.updateCartItem(user._id, itemId, { quantity: cartItem.quantity - 1 })
      } else {
        // Remove item completely if quantity is 1
        await cartApi.removeCartItem(user._id, itemId)
      }
      
      // Refresh cart after removing/updating
      await fetchCart()
      console.log('Cart updated after removing item')
    } catch (error) {
      console.error('Error removing from cart:', error)
      setError('Failed to remove item from cart')
    } finally {
      setCartLoading(false)
    }
  }

  const getCartQuantity = (itemId: string) => {
    if (!cart?.items) return 0
    const cartItem = cart.items.find(item => item.itemId._id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  const getTotalCartItems = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => total + (item.itemId.price || 0) * item.quantity, 0)
  }

  const getAvailableQuantity = (item: StoreItem) => {
    const cartQuantity = getCartQuantity(item._id)
    return (item.stock || 0) - cartQuantity
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Store</h2>
            <p className="text-muted-foreground">Browse and purchase sellable items</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading items...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Store</h2>
          <p className="text-muted-foreground">Browse and purchase sellable items</p>
        </div>
        
        {/* Cart Button */}
        <div className="flex items-center gap-4">
          {cart?.items && cart.items.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {getTotalCartItems()} items • LKR {getTotalPrice().toFixed(2)}
              </p>
            </div>
          )}
          <Button
            onClick={() => router.push('/memberDashboard/cart')}
            variant={cart?.items && cart.items.length > 0 ? 'default' : 'outline'}
            className="flex items-center gap-2"
            disabled={cartLoading}
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart
            {cart?.items && cart.items.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getTotalCartItems()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => (
          <Card key={item._id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Item Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {typeof item.categoryID === 'object' ? item.categoryID.name : 'No category'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Available: {getAvailableQuantity(item)} / {item.stock || 0}
                  </p>
                </div>
                
                {/* Price */}
                <div className="text-xl font-bold text-primary">
                  LKR {item.price?.toFixed(2) || '0.00'}
                </div>
                
                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  {getAvailableQuantity(item) === 0 ? (
                    <Badge variant="destructive">No More Available</Badge>
                  ) : getAvailableQuantity(item) <= (item.lowStockAlert || 5) ? (
                    <Badge variant="secondary">Low Available</Badge>
                  ) : (
                    <Badge variant="default">Available</Badge>
                  )}
                  {getCartQuantity(item._id) > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {getCartQuantity(item._id)} in cart
                    </Badge>
                  )}
                </div>
                
                {/* Cart Controls */}
                <div className="flex items-center justify-between">
                  {getCartQuantity(item._id) > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromCart(item._id)}
                        disabled={cartLoading}
                      >
                        -
                      </Button>
                      <span className="text-sm font-medium px-2">
                        {getCartQuantity(item._id)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(item)}
                        disabled={cartLoading || getCartQuantity(item._id) >= (item.stock || 0)}
                      >
                        +
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => addToCart(item)}
                      disabled={cartLoading || (item.stock || 0) === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No sellable items available</h3>
          <p>Check back later for new products</p>
        </div>
      )}
    </div>
  )
}