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

  // Temporarily disable auth for refund API calls
  // const token = localStorage.getItem('authToken')
  // if (token) {
  //   config.headers = {
  //     ...config.headers,
  //     Authorization: `Bearer ${token}`,
  //   }
  // }

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
export interface Refund {
  _id: string;
  paymentId: string;
  userId: string;
  refundId: string;
  originalAmount: number;
  refundAmount: number;
  status: 'pending' | 'completed' | 'failed';
  notes: string;
  gatewayRefundId?: string;
  gatewayResponse?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundData {
  paymentId: string;
  userId: string;
  refundAmount: number;
  originalAmount: number;
  notes: string;
}

export interface UpdateRefundData {
  refundAmount?: number;
  originalAmount?: number;
  status?: 'pending' | 'completed' | 'failed';
  notes?: string;
  gatewayRefundId?: string;
  gatewayResponse?: Record<string, unknown>;
}

// Get all refunds
export const getRefunds = async (): Promise<Refund[]> => {
  try {
    const response = await apiRequest<Refund[]>('/payments/refunds');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching refunds:', error);
    throw error;
  }
};

// Get refund by ID
export const getRefundById = async (id: string): Promise<Refund> => {
  try {
    const response = await apiRequest<Refund>(`/payments/refunds/${id}`);
    if (!response.data) {
      throw new Error('Refund not found');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching refund:', error);
    throw error;
  }
};

// Create new refund
export const createRefund = async (data: CreateRefundData): Promise<Refund> => {
  try {
    const response = await apiRequest<Refund>('/payments/refunds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to create refund');
    }
    return response.data;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
};

// Update refund
export const updateRefund = async (id: string, data: UpdateRefundData): Promise<Refund> => {
  try {
    const response = await apiRequest<Refund>(`/payments/refunds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to update refund');
    }
    return response.data;
  } catch (error) {
    console.error('Error updating refund:', error);
    throw error;
  }
};

// Delete refund
export const deleteRefund = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/payments/refunds/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting refund:', error);
    throw error;
  }
};

// Approve refund (update status to completed)
export const approveRefund = async (id: string): Promise<Refund> => {
  try {
    const response = await apiRequest<Refund>(`/payments/refunds/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed' }),
    });
    if (!response.data) {
      throw new Error('Failed to approve refund');
    }
    return response.data;
  } catch (error) {
    console.error('Error approving refund:', error);
    throw error;
  }
};

// Deny refund (update status to failed)
export const denyRefund = async (id: string): Promise<Refund> => {
  try {
    const response = await apiRequest<Refund>(`/payments/refunds/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'failed' }),
    });
    if (!response.data) {
      throw new Error('Failed to deny refund');
    }
    return response.data;
  } catch (error) {
    console.error('Error denying refund:', error);
    throw error;
  }
};
