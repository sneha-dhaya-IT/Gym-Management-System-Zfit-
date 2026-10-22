const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

/**
 * Generate refunds report PDF
 */
export const generateRefundsReport = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/reports/refunds/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to generate refunds report')
  }

  return response.blob()
}

/**
 * Generate refund requests report PDF
 */
export const generateRefundRequestsReport = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/reports/refund-requests/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to generate refund requests report')
  }

  return response.blob()
}

/**
 * Generate invoices report PDF
 */
export const generateInvoicesReport = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/reports/invoices/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to generate invoices report')
  }

  return response.blob()
}

/**
 * Generate payments report PDF
 */
export const generatePaymentsReport = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/reports/payments/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to generate payments report')
  }

  return response.blob()
}