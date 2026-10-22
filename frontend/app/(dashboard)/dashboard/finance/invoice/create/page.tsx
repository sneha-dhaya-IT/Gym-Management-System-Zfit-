"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  User,
  CreditCard,
  Calendar,
  FileText,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: string
  total: number
  tax: string
}

interface Payment {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  amount: number
  type: string
  status: string
  date: string
}

interface User {
  _id: string
  name: string
  email: string
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const [selectedPayment, setSelectedPayment] = useState("")
  const [status, setStatus] = useState("draft")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: "", total: 0, tax: "" }
  ])
  const [discount, setDiscount] = useState("")

  // API data
  const [payments, setPayments] = useState<Payment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch payments and users on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch payments
        const paymentsResponse = await fetch('/api/payments')
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          setPayments(paymentsData.data || [])
        }

        // Fetch users
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get selected payment details
  const selectedPaymentData = payments.find(p => p._id === selectedPayment)

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const totalTax = items.reduce((sum, item) => sum + (parseFloat(item.tax) || 0), 0)
  const discountValue = parseFloat(discount) || 0
  const total = subtotal + totalTax - discountValue

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: "", total: 0, tax: "" }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate total for the item
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity
      const unitPrice = field === 'unitPrice' ? (value === '' ? 0 : parseFloat(String(value)) || 0) : (updatedItems[index].unitPrice === '' ? 0 : parseFloat(updatedItems[index].unitPrice) || 0)
      updatedItems[index].total = quantity * unitPrice
    }

    setItems(updatedItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!selectedPayment || items.some(item => !item.description || item.total <= 0)) {
      alert("Please fill in all required fields and ensure all items have valid amounts.")
      return
    }

    const invoiceData = {
      paymentId: selectedPayment,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: item.total,
        tax: parseFloat(item.tax) || 0
      })),
      subtotal,
      tax: totalTax,
      discount: discountValue,
      total,
      dueDate: dueDate || null,
      status,
      generatedAt: new Date().toISOString(),
      notes
    }

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      })

      if (response.ok) {
        const result = await response.json()
        alert("Invoice created successfully!")
        router.push("/dashboard/finance/invoice")
      } else {
        const error = await response.json()
        alert(`Failed to create invoice: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      alert("Failed to create invoice. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
            <p className="text-muted-foreground">
              Generate a new invoice for your members.
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSubmit}>
            <FileText className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Select the payment that this invoice is for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment">Payment *</Label>
              <Select
                value={selectedPayment}
                onValueChange={setSelectedPayment}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading payments..." : "Select a payment"} />
                </SelectTrigger>
                <SelectContent>
                  {payments.map((payment) => (
                    <SelectItem key={payment._id} value={payment._id}>
                      {payment.userId.name} - {payment.type} - ${payment.amount} ({new Date(payment.date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPaymentData && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Selected Payment Details:</p>
                  <p className="text-sm text-muted-foreground">
                    Customer: {selectedPaymentData.userId.name} ({selectedPaymentData.userId.email})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Amount: ${selectedPaymentData.amount} | Type: {selectedPaymentData.type} | Status: {selectedPaymentData.status}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Invoice Items
              </div>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardTitle>
            <CardDescription>
              Add the items or services being invoiced.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-4">
                    <Label htmlFor={`description-${index}`}>Description *</Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`unitPrice-${index}`}>Unit Price</Label>
                    <Input
                      id={`unitPrice-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`tax-${index}`}>Tax</Label>
                    <Input
                      id={`tax-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.tax}
                      onChange={(e) => updateItem(index, 'tax', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-1">
                    <div className="text-sm font-medium">LKR {item.total.toFixed(2)}</div>
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>LKR {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>LKR {totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-LKR {discountValue.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>LKR {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for the invoice..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
