import React from 'react'
import { useTheme } from '../contexts/theme-context'
import { getBackendErrorMessage } from '../utils/backendHealth'

interface BackendStatusAlertProps {
  isVisible: boolean
}

const BackendStatusAlert: React.FC<BackendStatusAlertProps> = ({ isVisible }) => {
  const { isDarkMode } = useTheme()

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40">
      <div className={`rounded-xl border-2 border-red-500 bg-red-50 px-6 py-4 shadow-lg transition-all duration-300 ${
        isDarkMode 
          ? 'bg-red-900/20 border-red-400 text-red-100' 
          : 'bg-red-50 border-red-500 text-red-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            isDarkMode ? 'bg-red-400' : 'bg-red-500'
          }`}></div>
                      <div className="text-center">
              <h3 className={`font-semibold text-lg mb-1 ${
                isDarkMode ? 'text-red-100' : 'text-red-800'
              }`}>
                Backend Service Unavailable
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-red-200' : 'text-red-700'
              }`}>
                {getBackendErrorMessage()}
              </p>
              <p className={`text-xs mt-2 ${
                isDarkMode ? 'text-red-300' : 'text-red-600'
              }`}>
                This may be temporary during heavy computations. Please wait a moment.
              </p>
            </div>
        </div>
      </div>
    </div>
  )
}

export default BackendStatusAlert 