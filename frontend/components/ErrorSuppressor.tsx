"use client"

import { useEffect } from 'react'

export default function ErrorSuppressor() {
  useEffect(() => {
    // Suppress errors from third-party scripts
    const handleError = (event: ErrorEvent) => {
      // Check if error is from third-party scripts
      const thirdPartyScripts = ['ma_payload.js', 'facebook.com', 'fbcdn.net']
      
      if (event.filename && thirdPartyScripts.some(script => event.filename.includes(script))) {
        event.preventDefault()
        console.warn('Third-party script error suppressed:', event.error)
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if rejection is from third-party scripts
      if (event.reason && event.reason.stack) {
        const thirdPartyScripts = ['ma_payload.js', 'facebook.com', 'fbcdn.net']
        
        if (thirdPartyScripts.some(script => event.reason.stack.includes(script))) {
          event.preventDefault()
          console.warn('Third-party script promise rejection suppressed:', event.reason)
          return false
        }
      }
    }

    // Add event listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}