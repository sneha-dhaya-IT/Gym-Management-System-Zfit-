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
export interface User {
  _id: string
  name: string
  email: string
  contactNo: string
  role: string
  status: string
}

export interface Payment {
  _id: string
  userId: string | {
    _id: string
    name: string
    email: string
    contactNo: string
    role: string
    status: string
  }
  amount: number
  currency: string
  type: 'membership' | 'inventory' | 'booking' | 'other'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: 'card' | 'bank-transfer' | 'cash'
  relatedId: string
  transactionId: string
  gatewayTransactionId?: string
  gatewayPaymentId?: string
  gatewayResponse?: Record<string, unknown>
  failureReason?: string
  refundedAmount: number
  refundReason?: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentData {
  amount: number
  type: 'membership' | 'inventory' | 'booking' | 'other'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: 'card' | 'bank-transfer' | 'cash'
  relatedId: string
  transactionId: string
  date: string
  userId: string
  currency?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface UpdatePaymentData {
  amount?: number
  type?: 'membership' | 'inventory' | 'booking' | 'other'
  status?: 'pending' | 'completed' | 'failed' | 'refunded'
  method?: 'card' | 'bank-transfer' | 'cash'
  relatedId?: string
  transactionId?: string
  date?: string
  currency?: string
  description?: string
  metadata?: Record<string, unknown>
}

// API functions
export const getPayments = async (): Promise<Payment[]> => {
  try {
    const response = await apiRequest<Payment[]>('/payments')
    if (!response.data) {
      throw new Error('Failed to fetch payments')
    }
    return response.data
  } catch (error) {
    console.error('Error fetching payments:', error)
    throw error
  }
}

export const getPaymentsByUserId = async (userId: string): Promise<ApiResponse<Payment[]>> => {
  try {
    const response = await apiRequest<Payment[]>(`/payments?userId=${userId}`)
    return {
      success: true,
      data: response.data || []
    }
  } catch (error) {
    console.error('Error fetching user payments:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const getPaymentById = async (id: string): Promise<Payment> => {
  try {
    const response = await apiRequest<Payment>(`/payments/${id}`)
    if (!response.data) {
      throw new Error('Failed to fetch payment')
    }
    return response.data
  } catch (error) {
    console.error('Error fetching payment:', error)
    throw error
  }
}

export const createPayment = async (paymentData: CreatePaymentData): Promise<Payment> => {
  try {
    const response = await apiRequest<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
    if (!response.data) {
      throw new Error('Failed to create payment')
    }
    return response.data
  } catch (error) {
    console.error('Error creating payment:', error)
    throw error
  }
}

export const updatePayment = async (id: string, paymentData: UpdatePaymentData): Promise<Payment> => {
  try {
    const response = await apiRequest<Payment>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    })
    if (!response.data) {
      throw new Error('Failed to update payment')
    }
    return response.data
  } catch (error) {
    console.error('Error updating payment:', error)
    throw error
  }
}

export const deletePayment = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/payments/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Error deleting payment:', error)
    throw error
  }
}

export const deleteAllPayments = async (): Promise<{ deletedCount: number }> => {
  try {
    const response = await apiRequest<{ deletedCount: number }>(`/payments/all`, {
      method: 'DELETE',
    })
    
    if (response.success && response.data) {
      return response.data
    } else {
      throw new Error(response.message || 'Failed to delete all payments')
    }
  } catch (error) {
    console.error('Error deleting all payments:', error)
    throw error
  }
}

// User API functions
export const getUserById = async (userId: string): Promise<ApiResponse<User>> => {
  try {
    const response = await apiRequest<User>(`/users/${userId}`)
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export interface PayHerePaymentRequest {
  userId: string
  amount: number
  currency?: string
  type: 'membership' | 'inventory' | 'booking' | 'other'
  relatedId?: string // Optional for 'other' type payments like cart
  description: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  customerCity: string
}

export interface PayHerePaymentResponse {
  paymentId: string
  orderId: string
  checkoutUrl: string
  paymentData: Record<string, unknown>
  paymentForm: string
}

export interface PayHereRefundRequest {
  paymentId: string
  amount: number
  reason?: string
}

export interface PayHereRefundResponse {
  refundId: string
  status: string
  amount: number
  currency: string
  processedAt: string
  checkoutUrl?: string // For redirect-based refunds
  paymentForm?: string // For form-based refunds
}

// PayHere refund function
export const initiatePayHereRefund = async (refundData: PayHereRefundRequest): Promise<PayHereRefundResponse> => {
  try {
    const response = await apiRequest<PayHereRefundResponse>('/gateways/payhere/refund', {
      method: 'POST',
      body: JSON.stringify(refundData),
    })
    
    console.log('PayHere refund API response:', response)
    
    // Handle special case where refund is processed but requires manual verification
    if (response.message && response.message.includes('Refund processed (manual verification required)')) {
      // Return a mock successful response for manual verification cases
      return {
        refundId: `${Date.now()}`,
        status: 'pending_verification',
        amount: refundData.amount,
        currency: 'LKR',
        processedAt: new Date().toISOString()
      }
    }
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to initiate PayHere refund')
    }
    return response.data
  } catch (error) {
    console.error('Error initiating PayHere refund:', error)
    throw error
  }
}

// PayHere payment functions
export const initiatePayHerePayment = async (paymentData: PayHerePaymentRequest): Promise<PayHerePaymentResponse> => {
  try {
    const response = await apiRequest<PayHerePaymentResponse>('/gateways/payhere/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
    
    console.log('PayHere API response:', response)
    console.log('PayHere response data:', response.data)
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to initiate PayHere payment')
    }
    return response.data
  } catch (error) {
    console.error('Error initiating PayHere payment:', error)
    throw error
  }
}

// Bank Transfer types
export interface BankTransferUploadResponse {
  fileUrl: string
  filename: string
  size: number
  mimetype: string
}

export interface BankTransferPaymentRequest {
  userId?: string // Optional for when included explicitly
  membershipId: string
  amount: number
  currency?: string
  receiptImageUrl: string
  notes?: string
}

export interface BankTransferPaymentResponse {
  id: string
  status: string
  createdAt: string
}

// Bank Transfer functions
export const uploadBankTransferReceipt = async (file: File): Promise<BankTransferUploadResponse> => {
  try {
    const formData = new FormData()
    formData.append('receipt', file)

    const response = await fetch(`${API_BASE_URL}/payments/bank-transfer/upload`, {
      method: 'POST',
      // Temporarily remove authorization for testing
      // headers: {
      //   'Authorization': `Bearer ${localStorage.getItem('token')}`,
      // },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    if (!data.success || !data.data) {
      throw new Error(data.message || 'Failed to upload receipt')
    }

    return data.data
  } catch (error) {
    console.error('Error uploading bank transfer receipt:', error)
    throw error
  }
}

export const createBankTransferPayment = async (paymentData: BankTransferPaymentRequest): Promise<BankTransferPaymentResponse> => {
  try {
    const response = await apiRequest<BankTransferPaymentResponse>('/payments/bank-transfer', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create bank transfer payment')
    }

    return response.data
  } catch (error) {
    console.error('Error creating bank transfer payment:', error)
    throw error
  }
}

// Bank Transfer Admin types
export interface BankTransferAdmin {
  _id: string
  transferId?: string
  userId: {
    _id: string
    name: string
    email: string
    contactNo?: string
    role: string
    status: string
  } | null
  membershipId: {
    _id: string
    name: string
    price: number
  } | null
  amount: number
  currency: string
  receiptImageUrl: string
  status: 'pending' | 'approved' | 'declined'
  bankDetails: {
    accountNumber: string
    bankName: string
    accountHolder: string
  }
  notes?: string
  adminNotes?: string
  processedBy?: {
    _id: string
    name: string
  } | null
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export interface BankTransferAdminResponse {
  payments: BankTransferAdmin[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApproveDeclineRequest {
  adminNotes?: string
}

// Bank Transfer Admin functions
export const getPendingBankTransfers = async (page: number = 1, limit: number = 10): Promise<BankTransferAdminResponse> => {
  try {
    const response = await apiRequest<{ payments: BankTransferAdmin[], pagination: { page: number, limit: number, total: number, pages: number } }>(`/admin/payments/bank-transfer/pending?page=${page}&limit=${limit}`)

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch pending bank transfers')
    }

    return response.data
  } catch (error) {
    console.error('Error fetching pending bank transfers:', error)
    throw error
  }
}

export const approveBankTransfer = async (transferId: string, data: ApproveDeclineRequest = {}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiRequest<{ success: boolean; message: string }>(`/admin/payments/bank-transfer/${transferId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to approve bank transfer')
    }

    return {
      success: response.success,
      message: response.message || 'Bank transfer approved successfully'
    }
  } catch (error) {
    console.error('Error approving bank transfer:', error)
    throw error
  }
}

export const declineBankTransfer = async (transferId: string, data: ApproveDeclineRequest = {}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiRequest<{ success: boolean; message: string }>(`/admin/payments/bank-transfer/${transferId}/decline`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to decline bank transfer')
    }

    return {
      success: response.success,
      message: response.message || 'Bank transfer declined successfully'
    }
  } catch (error) {
    console.error('Error declining bank transfer:', error)
    throw error
  }
}

export const deleteBankTransfer = async (transferId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiRequest<{ success: boolean; message: string }>(`/admin/payments/bank-transfer/${transferId}`, {
      method: 'DELETE',
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete bank transfer')
    }

    return {
      success: response.success,
      message: response.message || 'Bank transfer deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting bank transfer:', error)
    throw error
  }
}