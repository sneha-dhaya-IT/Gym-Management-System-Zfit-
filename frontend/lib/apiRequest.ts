const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Request cache to prevent duplicate requests
const requestCache = new Map<string, Promise<any>>()

// Rate limiting helper
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 100 // Minimum 100ms between requests

// Base request function with retry logic
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 0
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Create cache key for GET requests
  const cacheKey = options.method === 'GET' ? `${url}-${JSON.stringify(options)}` : null
  
  // Check if we already have a pending request for this endpoint
  if (cacheKey && requestCache.has(cacheKey)) {
    console.log('Using cached request for:', endpoint)
    return requestCache.get(cacheKey)!
  }

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
    ...options,
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      // Add small delay to prevent rapid requests
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
      }
      lastRequestTime = Date.now()
      
      const response = await fetch(url, config)
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // If not JSON, get text response
        const textResponse = await response.text()
        data = { message: textResponse }
      }

      if (!response.ok) {
        // Handle rate limiting with retry
        if (response.status === 429 && retries < 3) {
          const delay = Math.pow(2, retries) * 1000 // Exponential backoff: 1s, 2s, 4s
          console.log(`Rate limited, retrying in ${delay}ms... (attempt ${retries + 1}/3)`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return apiRequest(endpoint, options, retries + 1)
        }
        
        // If still rate limited after retries, provide helpful message
        if (response.status === 429) {
          throw new Error("Server is busy. Please wait a few minutes and try again.")
        }
        
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    } finally {
      // Remove from cache when request completes
      if (cacheKey) {
        requestCache.delete(cacheKey)
      }
    }
  })()

  // Add to cache for GET requests
  if (cacheKey) {
    requestCache.set(cacheKey, requestPromise)
  }

  return requestPromise
}