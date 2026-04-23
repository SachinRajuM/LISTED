import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
 
export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'recruiter' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
 
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })
 
  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome aboard.')
      const userData2 = JSON.parse(localStorage.getItem('user') || '{}')
      navigate(userData2.role === 'end_user' ? '/portal' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }
 
  const inputStyle = { background: 'rgba(37,37,53,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
 
  return (
    <div className="min-h-screen bg-obsidian flex">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 radial-glow pointer-events-none" />
 
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10 border-r border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center electric-glow">
            <span className="text-white font-bold">R</span>
          </div>
          <span className="font-semibold text-mist text-lg">RecruitAI</span>
        </Link>
 
        <div>
          <div className="inline-flex items-center gap-2 border border-volt/20 rounded-full px-4 py-1.5 mb-6" style={{ background: 'rgba(200,255,0,0.1)' }}>
            <span className="w-2 h-2 bg-volt rounded-full"></span>
            <span className="text-volt text-xs font-mono">AI-Powered Ranking</span>
          </div>
          <h2 className="text-4xl font-bold text-mist mb-4 leading-tight">
            Rank candidates<br />with confidence.
          </h2>
          <p className="text-ghost leading-relaxed">
            BERT embeddings + FAISS search means your top candidate surfaces in seconds — not days.
          </p>
          <div className="mt-10 space-y-4">
            {[
              'Upload resumes in bulk (PDF / DOCX)',
              'Semantic matching, not just keywords',
              'Transparent, explainable scores',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,255,0,0.2)' }}>
                  <span className="text-volt text-xs">✓</span>
                </div>
                <span className="text-ghost text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
 
        <p className="text-ghost text-xs">© 2026 RecruitAI — AI Talent Intelligence</p>
      </div>
 
      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-mist mb-2">Create account</h1>
            <p className="text-ghost text-sm">Start screening smarter today.</p>
          </div>
 
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Full Name</label>
              <input
                name="full_name" value={form.full_name} onChange={handle} required
                placeholder="Jane Smith"
                className="w-full rounded-xl px-4 py-3 text-mist text-sm focus:outline-none transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Email</label>
              <input
                name="email" type="email" value={form.email} onChange={handle} required
                placeholder="jane@company.com"
                className="w-full rounded-xl px-4 py-3 text-mist text-sm focus:outline-none transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle} required
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl px-4 py-3 pr-10 text-mist text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost hover:text-mist">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Role</label>
              <select
                name="role" value={form.role} onChange={handle}
                className="w-full rounded-xl px-4 py-3 text-mist text-sm focus:outline-none transition-colors appearance-none"
                style={inputStyle}
              >
                <option value="recruiter">Recruiter</option>
                <option value="hiring_manager">Hiring Manager</option>
                <option value="end_user">Candidate</option>
              </select>
            </div>
 
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-volt text-obsidian font-semibold py-3 rounded-xl hover:opacity-90 transition-all volt-glow mt-6 disabled:opacity-60"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><span>Create Account</span><ArrowRight size={15} /></>
              }
            </button>
          </form>
 
          <p className="mt-6 text-center text-ghost text-sm">
            Already have an account?{' '}
            <Link to="/signin" className="text-electric hover:opacity-80 transition-colors font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
 