import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { checkBackendHealth } from '../utils/backendHealth'

interface BackendStatusContextType {
  isBackendAvailable: boolean | null
  isLoading: boolean
}

const BackendStatusContext = createContext<BackendStatusContextType | undefined>(undefined)

export const useBackendStatus = () => {
  const context = useContext(BackendStatusContext)
  if (context === undefined) {
    throw new Error('useBackendStatus must be used within a BackendStatusProvider')
  }
  return context
}

interface BackendStatusProviderProps {
  children: ReactNode
}

export const BackendStatusProvider: React.FC<BackendStatusProviderProps> = ({ children }) => {
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isAvailable = await checkBackendHealth()
        
        if (isAvailable) {
          setIsBackendAvailable(true)
          setConsecutiveFailures(0)
        } else {
          // Only mark as unavailable after 3 consecutive failures (15 seconds total)
          setConsecutiveFailures(prev => {
            const newCount = prev + 1
            if (newCount >= 3) {
              setIsBackendAvailable(false)
            }
            return newCount
          })
        }
      } catch (error) {
        console.error('Backend health check failed:', error)
        setConsecutiveFailures(prev => {
          const newCount = prev + 1
          if (newCount >= 3) {
            setIsBackendAvailable(false)
          }
          return newCount
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Initial check
    checkBackend()

    // Periodic check every 10 seconds (increased from 5)
    const interval = setInterval(checkBackend, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <BackendStatusContext.Provider value={{ isBackendAvailable, isLoading }}>
      {children}
    </BackendStatusContext.Provider>
  )
} 