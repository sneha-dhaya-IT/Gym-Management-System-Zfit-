"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus } from 'lucide-react'

interface SupplementItem {
  _id: string
  itemName: string
  itemDescription: string
  categoryID: string
  quantity: number
  price?: number
  supplierID: {
    _id: string
    supplierName: string
  } | null
  lowStockThreshold: number
  maintenanceStatus: "good" | "maintenance_required" | "under_repair"
  lastMaintenanceDate?: string
  createdAt: string
}

interface SupplementCardProps {
  supplement: SupplementItem
  cartQuantity: number
  availableQuantity: number
  onAddToCart: (supplement: SupplementItem) => void
  onRemoveFromCart: (supplementId: string) => void
}

export function SupplementCard({
  supplement,
  cartQuantity,
  availableQuantity,
  onAddToCart,
  onRemoveFromCart
}: SupplementCardProps) {
  const isOutOfStock = supplement.quantity === 0
  const isLowStock = availableQuantity <= supplement.lowStockThreshold

  // Truncate text helper function
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  return (
    <Card className="h-[420px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 mr-2">
            <CardTitle className="text-lg mb-1 line-clamp-2 leading-tight">
              {truncateText(supplement.itemName, 40)}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {truncateText(supplement.categoryID, 15)}
            </Badge>
          </div>
          <div className="text-xl font-bold text-primary flex-shrink-0">
            LKR {supplement.price?.toFixed(2) || '0.00'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-3 flex-1">
          <CardDescription className="text-sm line-clamp-3 leading-relaxed">
            {supplement.itemDescription}
          </CardDescription>

          {supplement.supplierID && (
            <div className="text-xs text-muted-foreground truncate">
              By: {truncateText(supplement.supplierID.supplierName, 25)}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span>Stock:</span>
            <span className={`font-medium ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
              {availableQuantity} units
            </span>
          </div>
        </div>

        <div className="mt-auto flex-shrink-0">
          {isOutOfStock ? (
            <Button disabled className="w-full">
              Out of Stock
            </Button>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveFromCart(supplement._id)}
                className="flex-shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium text-center min-w-0 flex-1">
                {cartQuantity} in cart
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddToCart(supplement)}
                disabled={cartQuantity >= supplement.quantity}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => onAddToCart(supplement)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}