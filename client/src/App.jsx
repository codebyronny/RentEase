import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import Equipment from './pages/admin/Equipment'
import Customers from './pages/admin/Customers'
import Rentals from './pages/admin/Rentals'
import Returns from './pages/admin/Returns'
import Browse from './pages/customer/Browse'
import MyRentals from './pages/customer/MyRentals'
import Profile from './pages/customer/Profile'

function RequireAuth({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user
            ? <Navigate to="/login" replace />
            : <Navigate to={user.role === 'admin' ? '/admin' : '/customer'} replace />
        }
      />
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <RequireAuth role="admin">
            <DashboardLayout>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="equipment" element={<Equipment />} />
                <Route path="customers" element={<Customers />} />
                <Route path="rentals" element={<Rentals />} />
                <Route path="returns" element={<Returns />} />
              </Routes>
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* Customer routes */}
      <Route
        path="/customer/*"
        element={
          <RequireAuth role="customer">
            <DashboardLayout>
              <Routes>
                <Route index element={<Browse />} />
                <Route path="my-rentals" element={<MyRentals />} />
                <Route path="profile" element={<Profile />} />
              </Routes>
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#1a1a2e' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
