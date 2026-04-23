import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
 
export default function SignInPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
 
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })
 
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      const userData2 = JSON.parse(localStorage.getItem('user') || '{}')
      navigate(userData2.role === 'end_user' ? '/portal' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally { setLoading(false) }
  }
 
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-8 relative">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 radial-glow pointer-events-none" />
 
      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center electric-glow">
            <span className="text-white font-bold">R</span>
          </div>
          <span className="font-semibold text-mist text-lg">RecruitAI</span>
        </Link>
 
        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-mist mb-1">Sign in</h1>
          <p className="text-ghost text-sm mb-7">Continue to your workspace.</p>
 
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Email</label>
              <input
                name="email" type="email" value={form.email} onChange={handle} required
                placeholder="jane@company.com"
                className="w-full rounded-xl px-4 py-3 text-mist text-sm focus:outline-none transition-colors"
                style={{ background: 'rgba(37,37,53,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            <div>
              <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle} required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-10 text-mist text-sm focus:outline-none transition-colors"
                  style={{ background: 'rgba(37,37,53,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost hover:text-mist">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
 
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-volt text-obsidian font-semibold py-3 rounded-xl hover:opacity-90 transition-all volt-glow mt-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={15} /></>}
            </button>
          </form>
 
          {/* Demo credentials */}
          <div className="mt-5 p-3 rounded-xl" style={{ background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.15)' }}>
            <p className="text-xs text-ghost font-mono mb-1">Demo credentials:</p>
            <p className="text-xs text-electric font-mono">admin@recruitai.com / admin123</p>
          </div>
        </div>
 
        <p className="mt-5 text-center text-ghost text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-electric hover:opacity-80 transition-colors font-medium">Register</Link>
        </p>
      </div>
    </div>
  )
}
 