const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Workout interfaces
interface WorkoutData {
  memberId: string
  exercise: string
  sets: number
  reps: number
  weight: number
  notes?: string
  date: Date | string
}

interface Workout extends WorkoutData {
  _id: string
  createdAt: string
  updatedAt: string
}

// Nutrition interfaces
interface NutritionData {
  memberId: string
  mealType: string
  calories: number
  macros?: {
    protein?: number
    carbs?: number
    fats?: number
  }
  notes?: string
  date: Date | string
}

interface Nutrition extends NutritionData {
  _id: string
  createdAt: string
  updatedAt: string
}

// Goal interfaces
interface GoalData {
  memberId: string
  goalType: string
  target: string
  deadline?: Date | string
  assignedBy?: string
}

interface Goal extends GoalData {
  _id: string
  createdAt: string
  updatedAt: string
}

// Progress interfaces
interface ProgressData {
  memberId: string
  workoutsCompleted: number
  attendance: number
  goalsAchieved: number
  date: Date | string
}

interface Progress extends ProgressData {
  _id: string
  createdAt: string
  updatedAt: string
}

export type { WorkoutData, Workout, NutritionData, Nutrition, GoalData, Goal, ProgressData, Progress }

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

// Workout API functions
export const getWorkouts = (memberId?: string) => {
  const endpoint = memberId ? `/progress/workouts?memberId=${memberId}` : '/progress/workouts'
  return apiRequest<Workout[]>(endpoint)
}

export const getWorkoutById = (id: string) => apiRequest<Workout>(`/progress/workouts/${id}`)

export const createWorkout = (workoutData: WorkoutData) =>
  apiRequest<Workout>('/progress/workouts', {
    method: 'POST',
    body: JSON.stringify(workoutData),
  })

export const updateWorkout = (id: string, workoutData: Partial<WorkoutData>) =>
  apiRequest<Workout>(`/progress/workouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(workoutData),
  })

export const deleteWorkout = (id: string) =>
  apiRequest(`/progress/workouts/${id}`, {
    method: 'DELETE',
  })

// Nutrition API functions
export const getNutrition = (memberId?: string) => {
  const endpoint = memberId ? `/progress/nutrition?memberId=${memberId}` : '/progress/nutrition'
  return apiRequest<Nutrition[]>(endpoint)
}

export const getNutritionById = (id: string) => apiRequest<Nutrition>(`/progress/nutrition/${id}`)

export const createNutrition = (nutritionData: NutritionData) =>
  apiRequest<Nutrition>('/progress/nutrition', {
    method: 'POST',
    body: JSON.stringify(nutritionData),
  })

export const updateNutrition = (id: string, nutritionData: Partial<NutritionData>) =>
  apiRequest<Nutrition>(`/progress/nutrition/${id}`, {
    method: 'PUT',
    body: JSON.stringify(nutritionData),
  })

export const deleteNutrition = (id: string) =>
  apiRequest(`/progress/nutrition/${id}`, {
    method: 'DELETE',
  })

// Goal API functions
export const getGoals = (memberId?: string) => {
  const endpoint = memberId ? `/progress/goals?memberId=${memberId}` : '/progress/goals'
  return apiRequest<Goal[]>(endpoint)
}

export const getGoalById = (id: string) => apiRequest<Goal>(`/progress/goals/${id}`)

export const createGoal = (goalData: GoalData) =>
  apiRequest<Goal>('/progress/goals', {
    method: 'POST',
    body: JSON.stringify(goalData),
  })

export const updateGoal = (id: string, goalData: Partial<GoalData>) =>
  apiRequest<Goal>(`/progress/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(goalData),
  })

export const deleteGoal = (id: string) =>
  apiRequest(`/progress/goals/${id}`, {
    method: 'DELETE',
  })

// Progress API functions
export const getProgress = (memberId?: string) => {
  const endpoint = memberId ? `/progress?memberId=${memberId}` : '/progress'
  return apiRequest<Progress[]>(endpoint)
}

export const getProgressById = (id: string) => apiRequest<Progress>(`/progress/${id}`)

export const createProgress = (progressData: ProgressData) =>
  apiRequest<Progress>('/progress', {
    method: 'POST',
    body: JSON.stringify(progressData),
  })

export const updateProgress = (id: string, progressData: Partial<ProgressData>) =>
  apiRequest<Progress>(`/progress/${id}`, {
    method: 'PUT',
    body: JSON.stringify(progressData),
  })

export const deleteProgress = (id: string) =>
  apiRequest(`/progress/${id}`, {
    method: 'DELETE',
  })

// Combined API service
export const trackingApi = {
  // Workout
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  
  // Nutrition
  getNutrition,
  getNutritionById,
  createNutrition,
  updateNutrition,
  deleteNutrition,
  
  // Goals
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  
  // Progress
  getProgress,
  getProgressById,
  createProgress,
  updateProgress,
  deleteProgress,
}
