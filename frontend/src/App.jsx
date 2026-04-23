import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider, useAuth } from './context/AuthContext'
 
import HeroPage      from './pages/HeroPage'
import SignInPage    from './pages/SignInPage'
import RegisterPage  from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import JobsPage      from './pages/JobsPage'
import JobDetailPage from './pages/JobDetailPage'
import UploadPage    from './pages/UploadPage'
import RankingPage   from './pages/RankingPage'
import AdminPage     from './pages/AdminPage'
import EndUserPage   from './pages/EndUserPage'
import Layout        from './components/Layout'
 
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/signin" replace />
}
 
function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/signin" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
 
function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}
 
// End users get their own full-page portal, not the recruiter sidebar layout
function SmartDashboard() {
  const { user } = useAuth()
  if (user?.role === 'end_user') return <EndUserPage />
  return <DashboardPage />
}
 
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<HeroPage />} />
      <Route path="/signin"   element={<GuestOnly><SignInPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
 
      {/* End user portal — full page, no sidebar */}
      <Route path="/portal"   element={<RequireAuth><EndUserPage /></RequireAuth>} />
 
      {/* Recruiter / Admin — sidebar layout */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/dashboard"      element={<SmartDashboard />} />
        <Route path="/jobs"           element={<JobsPage />} />
        <Route path="/jobs/:id"       element={<JobDetailPage />} />
        <Route path="/upload/:jobId"  element={<UploadPage />} />
        <Route path="/ranking/:jobId" element={<RankingPage />} />
        <Route path="/profile"        element={<EndUserPage />} />
        <Route path="/admin"          element={<RequireAdmin><AdminPage /></RequireAdmin>} />
      </Route>
 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
 
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3500}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
 