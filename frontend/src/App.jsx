import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import AddService from './pages/AddService'
import Logs from './pages/Logs'
import PublicStatus from './pages/PublicStatus'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public/:username" element={<PublicStatus />} />
          <Route path="/public" element={<div className="p-12 text-center text-dark-400">Please append a username to the URL, e.g., /public/username</div>} />

          {/* Protected pages with navbar */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div className="min-h-screen bg-dark-900">
                  <Navbar />
                  <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/add" element={<AddService />} />
                      <Route path="/logs" element={<Logs />} />
                    </Routes>
                  </main>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
