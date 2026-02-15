import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DragonLoader from './DragonLoader'

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <DragonLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
