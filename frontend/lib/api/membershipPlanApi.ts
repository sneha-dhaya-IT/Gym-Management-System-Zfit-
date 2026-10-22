import { z } from "@/node_modules/zod/v4/classic/external.cjs"

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

  // Add auth token if available
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

export interface MembershipPlan {
  _id: string
  name: string
  description?: string
  price: number
  currency: string
  durationInDays: number
  category: string
  createdAt: string
  updatedAt: string
}

export interface CreateMembershipPlanData {
  name: string
  description?: string
  price: number
  currency: 'LKR' | 'USD'
  durationInDays: number
  category: 'weights' | 'crossfit' | 'yoga' | 'mma' | 'other'
}

export interface UpdateMembershipPlanData {
  name?: string
  description?: string
  price?: number
  currency?: 'LKR' | 'USD'
  durationInDays?: number
  category?: 'weights' | 'crossfit' | 'yoga' | 'mma' | 'other'
}

export const membershipPlanApi = {
  // Get all membership plans
  getAllMembershipPlans: async (): Promise<{ success: boolean; data: MembershipPlan[] }> => {
    const response = await apiRequest<MembershipPlan[]>('/membership-plans')
    return response as { success: boolean; data: MembershipPlan[] }
  },

  // Get membership plan by ID
  getMembershipPlanById: async (id: string): Promise<{ success: boolean; data: MembershipPlan }> => {
    const response = await apiRequest<MembershipPlan>(`/membership-plans/${id}`)
    return response as { success: boolean; data: MembershipPlan }
  },

  // Get membership plans by category
  getMembershipPlansByCategory: async (category: string): Promise<{ success: boolean; data: MembershipPlan[] }> => {
    const response = await apiRequest<MembershipPlan[]>(`/membership-plans/category/${category}`)
    return response as { success: boolean; data: MembershipPlan[] }
  },

  // Create new membership plan
  createMembershipPlan: async (data: CreateMembershipPlanData): Promise<{ success: boolean; message: string; data: MembershipPlan }> => {
    const response = await apiRequest<MembershipPlan>('/membership-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: MembershipPlan }
  },

  // Update membership plan
  updateMembershipPlan: async (id: string, data: UpdateMembershipPlanData): Promise<{ success: boolean; message: string; data: MembershipPlan }> => {
    const response = await apiRequest<MembershipPlan>(`/membership-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: MembershipPlan }
  },

  // Delete membership plan
  deleteMembershipPlan: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest(`/membership-plans/${id}`, {
      method: 'DELETE',
    })
    return response as { success: boolean; message: string }
  },

  // Get membership plan categories
  getMembershipPlanCategories: async (): Promise<{ success: boolean; data: string[] }> => {
    const response = await apiRequest<string[]>('/membership-plans/categories')
    return response as { success: boolean; data: string[] }
  },
}
// Validation schema
export const classFormSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  type: z.enum(["yoga", "pilates", "zumba", "spinning", "crossfit", "strength", "cardio", "other"], { errorMap: () => ({ message: "Select a class type" }) }),
  duration: z.number().min(40, "Duration must be at least 40 minutes")
    .max(180, "Duration cannot exceed 180 minutes"),
  maxCapacity: z.number().min(1, "Capacity must be at least 1")
    .max(20, "Capacity cannot exceed 20"),
  price: z.number().min(0, "Price cannot be negative"),
  status: z.enum(["active", "inactive"], { errorMap: () => ({ message: "Select status" }) }),
  notes: z.string().max(1000).optional(),
});
