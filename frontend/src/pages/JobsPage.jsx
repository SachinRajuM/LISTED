import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { Plus, Search, Briefcase, MapPin, Clock, Users, Trash2, X, Loader2, ChevronRight } from 'lucide-react'
 
function JobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', department: '', location: '', description: '', requirements: '', employment_type: 'full_time' })
  const [loading, setLoading] = useState(false)
 
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })
 
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await jobsAPI.create(form)
      toast.success('Job posted successfully!')
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create job')
    } finally { setLoading(false) }
  }
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur">
      <div className="glass w-full max-w-lg rounded-2xl p-7 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-ghost hover:text-mist">
          <X size={18} />
        </button>
        <h2 className="font-display text-xl font-bold text-mist mb-6">Post New Job</h2>
        <form onSubmit={submit} className="space-y-4">
          {[
            { name: 'title', label: 'Job Title', placeholder: 'e.g. Senior React Developer' },
            { name: 'department', label: 'Department', placeholder: 'e.g. Engineering' },
            { name: 'location', label: 'Location', placeholder: 'e.g. Remote / New York' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">{label}</label>
              <input
                name={name} value={form[name]} onChange={handle} placeholder={placeholder} required
                className="w-full bg-slate/50 border border-white/8 rounded-xl px-4 py-2.5 text-mist placeholder-ghost/40 text-sm focus:outline-none focus:border-electric/50 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Employment Type</label>
            <select name="employment_type" value={form.employment_type} onChange={handle}
              className="w-full bg-slate/50 border border-white/8 rounded-xl px-4 py-2.5 text-mist text-sm focus:outline-none focus:border-electric/50 appearance-none">
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Job Description</label>
            <textarea
              name="description" value={form.description} onChange={handle} required rows={4}
              placeholder="Describe the role, responsibilities, and what the ideal candidate looks like..."
              className="w-full bg-slate/50 border border-white/8 rounded-xl px-4 py-2.5 text-mist placeholder-ghost/40 text-sm focus:outline-none focus:border-electric/50 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ghost mb-1.5 font-mono uppercase tracking-wider">Requirements</label>
            <textarea
              name="requirements" value={form.requirements} onChange={handle} rows={3}
              placeholder="List required skills, years of experience, education..."
              className="w-full bg-slate/50 border border-white/8 rounded-xl px-4 py-2.5 text-mist placeholder-ghost/40 text-sm focus:outline-none focus:border-electric/50 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-ghost hover:text-mist text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-volt text-obsidian font-semibold py-2.5 rounded-xl hover:bg-volt/90 transition-all volt-glow text-sm disabled:opacity-60">
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
 
const typeColors = {
  full_time: 'text-neon bg-neon/10',
  part_time: 'text-amber bg-amber/10',
  contract: 'text-electric bg-electric/10',
  internship: 'text-volt bg-volt/10',
}
 
export default function JobsPage() {
  const { isRecruiter } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
 
  const fetchJobs = async () => {
    try {
      const res = await jobsAPI.list({ search })
      setJobs(res.data.items || res.data || [])
    } catch {
      setJobs([
        { id: 1, title: 'Senior React Developer', department: 'Engineering', location: 'Remote', employment_type: 'full_time', resume_count: 47, created_at: new Date().toISOString() },
        { id: 2, title: 'ML Engineer', department: 'Data Science', location: 'New York', employment_type: 'full_time', resume_count: 33, created_at: new Date().toISOString() },
        { id: 3, title: 'Product Designer', department: 'Design', location: 'Remote', employment_type: 'contract', resume_count: 28, created_at: new Date().toISOString() },
      ])
    } finally { setLoading(false) }
  }
 
  useEffect(() => { fetchJobs() }, [])
 
  const deleteJob = async (id, e) => {
    e.preventDefault()
    if (!confirm('Delete this job and all its resumes?')) return
    try {
      await jobsAPI.delete(id)
      setJobs(jobs.filter(j => j.id !== id))
      toast.success('Job deleted')
    } catch { toast.error('Failed to delete') }
  }
 
  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase())
  )
 
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-mist">Jobs</h1>
          <p className="text-ghost text-sm mt-1">{jobs.length} active positions</p>
        </div>
        {isRecruiter && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-volt text-obsidian text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-volt/90 transition-all volt-glow">
            <Plus size={15} /> Post Job
          </button>
        )}
      </div>
 
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs..."
          className="w-full bg-slate/50 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-mist placeholder-ghost focus:outline-none focus:border-electric/40 transition-colors"
        />
      </div>
 
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-electric" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="glass rounded-2xl p-6 hover:border-electric/20 transition-all group block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center">
                  <Briefcase size={16} className="text-electric" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeColors[job.employment_type] || 'text-ghost bg-slate'}`}>
                    {job.employment_type?.replace('_', ' ')}
                  </span>
                  {isRecruiter && (
                    <button
                      onClick={(e) => deleteJob(job.id, e)}
                      className="p-1.5 rounded-lg text-ghost hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-display font-semibold text-mist group-hover:text-electric transition-colors mb-1">{job.title}</h3>
              <p className="text-ghost text-sm mb-4">{job.department}</p>
              <div className="flex items-center gap-4 text-xs text-ghost">
                <span className="flex items-center gap-1.5"><MapPin size={11} />{job.location || 'Remote'}</span>
                <span className="flex items-center gap-1.5"><Users size={11} />{job.resume_count || 0} resumes</span>
                <span className="flex items-center gap-1.5"><Clock size={11} />{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-electric text-xs font-medium group-hover:gap-3 transition-all">
                View & Rank <ChevronRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      )}
 
      {showModal && <JobModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); fetchJobs() }} />}
    </div>
  )
}
 