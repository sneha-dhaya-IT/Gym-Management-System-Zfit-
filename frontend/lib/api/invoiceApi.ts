const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Base request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Get token from localStorage
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Types based on backend model
export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  tax: number
}

export interface PopulatedUser {
  _id: string
  name: string
  email: string
  contactNo?: string
}

export interface PopulatedPayment {
  _id: string
  transactionId: string
  type: string
  method: string
  amount: number
  status: string
  createdAt: string
}

export interface Invoice {
  _id: string
  paymentId: string | PopulatedPayment
  userId: string | PopulatedUser
  number: string
  items?: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  dueDate?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  generatedAt: string
  pdfUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CreateInvoiceData {
  paymentId: string
  items?: InvoiceItem[]
  subtotal: number
  tax: number
  discount?: number
  total: number
  dueDate?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  generatedAt: string
  pdfUrl?: string
}

export interface UpdateInvoiceData {
  paymentId?: string
  items?: InvoiceItem[]
  subtotal?: number
  tax?: number
  discount?: number
  total?: number
  dueDate?: string
  status?: 'draft' | 'sent' | 'paid' | 'overdue'
  generatedAt?: string
  pdfUrl?: string
}

// API functions
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const response = await apiRequest<Invoice[]>('/payments/invoices')
    if (!response.data) {
      throw new Error('Failed to fetch invoices')
    }
    return response.data
  } catch (error) {
    console.error('Error fetching invoices:', error)
    throw error
  }
}

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  try {
    const response = await apiRequest<Invoice>(`/payments/invoices/${id}`)
    if (!response.data) {
      throw new Error('Failed to fetch invoice')
    }
    return response.data
  } catch (error) {
    console.error('Error fetching invoice:', error)
    throw error
  }
}

export const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
  try {
    const response = await apiRequest<Invoice>('/payments/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    })
    if (!response.data) {
      throw new Error('Failed to create invoice')
    }
    return response.data
  } catch (error) {
    console.error('Error creating invoice:', error)
    throw error
  }
}

export const updateInvoice = async (id: string, invoiceData: UpdateInvoiceData): Promise<Invoice> => {
  try {
    const response = await apiRequest<Invoice>(`/payments/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    })
    if (!response.data) {
      throw new Error('Failed to update invoice')
    }
    return response.data
  } catch (error) {
    console.error('Error updating invoice:', error)
    throw error
  }
}

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/payments/invoices/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    throw error
  }
}