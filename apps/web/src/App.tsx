import { useState, useEffect } from 'react'
import './App.css'

interface HealthStatus {
  status: string
  timestamp: string
  database: string
  userCount: number
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
    
    fetch(`${apiBase}/health`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setHealth(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">🔍 WorkSearch</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        
        {loading && (
          <p className="text-gray-400">Checking API connection...</p>
        )}
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded p-4">
            <p className="text-red-400">❌ API Error: {error}</p>
          </div>
        )}
        
        {health && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">API Status:</span>
              <span className="text-green-400">✅ {health.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Database:</span>
              <span className="text-green-400">✅ {health.database}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Users in DB:</span>
              <span>{health.userCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Timestamp:</span>
              <span className="text-sm">{new Date(health.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-gray-500 text-sm">
        Ready to implement: Auth → Companies → Applications → Board
      </p>
    </div>
  )
}

export default App
