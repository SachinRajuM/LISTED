import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { jobsAPI, resumesAPI, rankingsAPI } from '../api'
import { toast } from 'react-toastify'
import { useDropzone } from 'react-dropzone'
import {
  User, Mail, Shield, LogOut, Briefcase, Upload, BarChart3,
  MapPin, Clock, ChevronRight, FileText, CheckCircle,
  AlertCircle, Loader2, X, ArrowLeft, Star
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
 
const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer {
    0%{background-position:-400px 0} 100%{background-position:400px 0}
  }
  @keyframes scoreGrow { from{stroke-dashoffset:131.9} to{stroke-dashoffset:var(--offset)} }
  .card  { animation: fadeUp .4s ease both; }
  .card:hover { border-color: rgba(108,99,255,0.25) !important; transform: translateY(-1px); }
  .shimmer {
    background: linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.03) 75%);
    background-size: 400px 100%; animation: shimmer 1.4s infinite;
  }
  .tab-btn { transition: background .15s, color .15s; }
  .job-card { transition: border-color .2s, transform .2s; }
  .job-card:hover { border-color: rgba(108,99,255,0.3) !important; transform: translateY(-2px); }
`
 
const scoreColor = s => s >= 80 ? '#C8FF00' : s >= 65 ? '#00FFB2' : s >= 45 ? '#6C63FF' : '#FFB800'
const scoreLabel = s => s >= 80 ? 'Excellent Match' : s >= 65 ? 'Good Match' : s >= 45 ? 'Average Match' : 'Below Average'
 
// ── Score Ring ────────────────────────────────────────
function ScoreRing({ score, size = 80 }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * score) / 100
  const color = scoreColor(score)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>{Math.round(score)}</span>
        <span style={{ fontSize: 9, color: '#9090A8', marginTop: 1 }}>/ 100</span>
      </div>
    </div>
  )
}
 
// ── Upload Modal ──────────────────────────────────────
function UploadModal({ job, onClose, onUploaded }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
 
  const onDrop = useCallback(accepted => {
    setFiles(accepted.slice(0, 1).map(f => ({ file: f, name: f.name, size: f.size, status: 'pending' })))
  }, [])
 
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error('Max 10MB, PDF or DOCX only'),
  })
 
  const upload = async () => {
    if (!files.length) return
    setUploading(true)
    setFiles(f => f.map(x => ({ ...x, status: 'uploading' })))
    try {
      const fd = new FormData()
      fd.append('file', files[0].file)
      await resumesAPI.upload(fd, job.id)
      setFiles(f => f.map(x => ({ ...x, status: 'success' })))
      setDone(true)
      toast.success('Resume uploaded & processed!')
      setTimeout(() => { onUploaded(job.id) }, 1200)
    } catch (err) {
      setFiles(f => f.map(x => ({ ...x, status: 'error' })))
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally { setUploading(false) }
  }
 
  const fmt = b => b < 1024*1024 ? (b/1024).toFixed(0)+' KB' : (b/1024/1024).toFixed(1)+' MB'
 
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#9090A8', cursor: 'pointer' }}><X size={18} /></button>
 
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8E8F0', margin: '0 0 4px' }}>Apply for this role</h2>
          <p style={{ color: '#9090A8', fontSize: 13, margin: 0 }}>{job.title} · {job.department || 'General'}</p>
        </div>
 
        {/* Dropzone */}
        <div {...getRootProps()} style={{
          border: `2px dashed ${isDragActive ? '#6C63FF' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 14, padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
          background: isDragActive ? 'rgba(108,99,255,0.06)' : 'rgba(255,255,255,0.01)',
          transition: 'all .2s', marginBottom: 14,
        }}>
          <input {...getInputProps()} />
          <Upload size={28} color={isDragActive ? '#6C63FF' : '#9090A8'} style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ color: '#E8E8F0', fontWeight: 600, margin: '0 0 4px' }}>
            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
          </p>
          <p style={{ color: '#9090A8', fontSize: 12, margin: '0 0 12px' }}>or click to browse</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {['PDF', 'DOCX', 'Max 10MB'].map(t => (
              <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: '#9090A8' }}>{t}</span>
            ))}
          </div>
        </div>
 
        {/* File item */}
        {files.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(37,37,53,0.5)', borderRadius: 10, marginBottom: 16 }}>
            <FileText size={16} color="#6C63FF" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#E8E8F0', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{files[0].name}</div>
              <div style={{ color: '#9090A8', fontSize: 11, marginTop: 2 }}>
                {fmt(files[0].size)} ·{' '}
                <span style={{ color: files[0].status === 'success' ? '#00FFB2' : files[0].status === 'error' ? '#FF4D6D' : '#9090A8' }}>
                  {files[0].status === 'uploading' ? 'Processing…' : files[0].status === 'success' ? 'Uploaded!' : files[0].status === 'error' ? 'Failed' : 'Ready'}
                </span>
              </div>
            </div>
            {files[0].status === 'success' && <CheckCircle size={16} color="#00FFB2" />}
            {files[0].status === 'error'   && <AlertCircle size={16} color="#FF4D6D" />}
            {files[0].status === 'uploading' && <Loader2 size={16} color="#6C63FF" className="animate-spin" />}
            {files[0].status === 'pending' && <button onClick={() => setFiles([])} style={{ background: 'none', border: 'none', color: '#9090A8', cursor: 'pointer', padding: 2 }}><X size={13} /></button>}
          </div>
        )}
 
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#9090A8', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={upload} disabled={!files.length || uploading || done} style={{
            flex: 2, padding: '10px', borderRadius: 12, border: 'none',
            background: done ? '#00FFB2' : '#6C63FF',
            color: done ? '#0A0A0F' : '#fff',
            fontWeight: 700, cursor: files.length && !uploading ? 'pointer' : 'not-allowed',
            fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: !files.length ? 0.5 : 1, transition: 'background .3s',
          }}>
            {done ? <><CheckCircle size={14} /> Submitted!</> :
             uploading ? <><Loader2 size={14} className="animate-spin" /> Processing…</> :
             <><Upload size={14} /> Submit Resume</>}
          </button>
        </div>
      </div>
    </div>
  )
}
 
// ── My Ranking Card ───────────────────────────────────
function MyRankingCard({ jobId, jobTitle }) {
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    rankingsAPI.results(jobId)
      .then(res => {
        const results = res.data?.results || []
        if (results.length > 0) setRanking(results[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [jobId])
 
  const color = ranking ? scoreColor(ranking.score || 0) : '#9090A8'
 
  return (
    <div style={{ background: 'rgba(26,26,38,0.9)', border: `1px solid ${color}33`, borderRadius: 16, padding: 20, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, color: '#E8E8F0', fontSize: 14 }}>{jobTitle}</div>
          <div style={{ color: '#9090A8', fontSize: 12, marginTop: 2 }}>Your application result</div>
        </div>
        {!loading && ranking && <ScoreRing score={ranking.score || 0} size={70} />}
        {loading && <div className="shimmer" style={{ width: 70, height: 70, borderRadius: '50%' }} />}
      </div>
 
      {!loading && ranking && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              ['Skills',     ranking.skills_score],
              ['Experience', ranking.experience_score],
              ['Semantic',   ranking.semantic_score],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor(val || 0), fontFamily: 'monospace' }}>{Math.round(val || 0)}%</div>
                <div style={{ fontSize: 10, color: '#9090A8', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
 
          {ranking.extracted_skills?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#9090A8', marginBottom: 6 }}>Detected skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ranking.extracted_skills.slice(0, 6).map(s => (
                  <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(108,99,255,0.12)', color: '#6C63FF' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
 
          <div style={{ padding: '8px 12px', background: color + '11', border: `1px solid ${color}33`, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Star size={12} color={color} fill={color} />
            <span style={{ fontSize: 12, color, fontWeight: 600 }}>{scoreLabel(ranking.score || 0)}</span>
          </div>
 
          {ranking.summary && (
            <p style={{ color: '#9090A8', fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>{ranking.summary}</p>
          )}
        </>
      )}
 
      {!loading && !ranking && (
        <div style={{ color: '#9090A8', fontSize: 13, padding: '8px 0' }}>
          Ranking not yet available. The recruiter will run AI ranking soon.
        </div>
      )}
    </div>
  )
}
 
// ── Main Page ─────────────────────────────────────────
export default function EndUserPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('jobs')          // 'jobs' | 'applications' | 'profile'
  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [uploadJob, setUploadJob] = useState(null)
  const [appliedJobs, setAppliedJobs] = useState([]) // { jobId, jobTitle }
  const [search, setSearch] = useState('')
 
  useEffect(() => {
    jobsAPI.list({ limit: 50 })
      .then(res => setJobs(res.data?.items || res.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoadingJobs(false))
  }, [])
 
  const handleUploaded = (jobId) => {
    setUploadJob(null)
    const job = jobs.find(j => j.id === jobId)
    if (job && !appliedJobs.find(a => a.jobId === jobId)) {
      setAppliedJobs(prev => [...prev, { jobId, jobTitle: job.title }])
    }
    setTab('applications')
    toast.success('Application submitted! Check your ranking below.')
  }
 
  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Signed out')
  }
 
  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase())
  )
 
  const initial = user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
 
  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, sans-serif', color: '#E8E8F0', display: 'flex', flexDirection: 'column' }}>
 
        {/* Top Nav */}
        <header style={{ height: 60, background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 15, boxShadow: '0 0 14px rgba(108,99,255,0.35)' }}>R</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#E8E8F0' }}>RecruitAI</span>
          </div>
 
          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 24 }}>
            {[
              { key: 'jobs',         label: 'Browse Jobs',    icon: Briefcase  },
              { key: 'applications', label: 'My Applications',icon: BarChart3  },
              { key: 'profile',      label: 'Profile',        icon: User       },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)} className="tab-btn" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10, border: 'none',
                background: tab === key ? 'rgba(108,99,255,0.15)' : 'none',
                color: tab === key ? '#6C63FF' : '#9090A8',
                cursor: 'pointer', fontSize: 13, fontWeight: tab === key ? 600 : 400,
              }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
 
          {/* User + logout */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E8E8F0' }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: '#9090A8', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6C63FF', fontSize: 14 }}>{initial}</div>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 10, padding: '6px 12px', color: '#FF4D6D', cursor: 'pointer', fontSize: 12 }}>
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </header>
 
        {/* Main */}
        <main style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '28px 20px' }}>
 
          {/* ── BROWSE JOBS TAB ── */}
          {tab === 'jobs' && (
            <div>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Open Positions</h1>
                <p style={{ color: '#9090A8', fontSize: 13, margin: 0 }}>{jobs.length} active jobs — upload your resume to apply</p>
              </div>
 
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or department..."
                style={{ width: '100%', background: 'rgba(37,37,53,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', color: '#E8E8F0', fontSize: 13, outline: 'none', marginBottom: 18, boxSizing: 'border-box' }}
              />
 
              {loadingJobs ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[0,1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 160, borderRadius: 14 }} />)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {filtered.map((job, i) => {
                    const applied = appliedJobs.some(a => a.jobId === job.id)
                    return (
                      <div key={job.id} className="job-card card" style={{
                        background: 'rgba(26,26,38,0.85)',
                        border: applied ? '1px solid rgba(0,255,178,0.25)' : '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 14, padding: 20,
                        animationDelay: i * 0.05 + 's',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Briefcase size={16} color="#6C63FF" />
                          </div>
                          {applied && (
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,255,178,0.1)', color: '#00FFB2', border: '1px solid rgba(0,255,178,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={10} /> Applied
                            </span>
                          )}
                        </div>
 
                        <div style={{ fontWeight: 700, color: '#E8E8F0', fontSize: 14, marginBottom: 3 }}>{job.title}</div>
                        <div style={{ color: '#9090A8', fontSize: 12, marginBottom: 12 }}>{job.department}</div>
 
                        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#9090A8', marginBottom: 14 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{job.location || 'Remote'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={10} />{job.employment_type?.replace('_', ' ')}</span>
                        </div>
 
                        <button
                          onClick={() => setUploadJob(job)}
                          style={{
                            width: '100%', padding: '9px', borderRadius: 10, border: 'none',
                            background: applied ? 'rgba(0,255,178,0.1)' : '#6C63FF',
                            color: applied ? '#00FFB2' : '#fff',
                            fontWeight: 600, cursor: 'pointer', fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'background .2s',
                          }}
                        >
                          <Upload size={13} />
                          {applied ? 'Apply Again' : 'Apply Now'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
 
          {/* ── MY APPLICATIONS TAB ── */}
          {tab === 'applications' && (
            <div>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>My Applications</h1>
                <p style={{ color: '#9090A8', fontSize: 13, margin: 0 }}>
                  {appliedJobs.length > 0
                    ? `${appliedJobs.length} application${appliedJobs.length > 1 ? 's' : ''} submitted — see your AI ranking below`
                    : 'No applications yet — browse jobs and upload your resume'}
                </p>
              </div>
 
              {appliedJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(26,26,38,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
                  <BarChart3 size={40} color="#9090A8" style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
                  <p style={{ color: '#9090A8', fontSize: 14, marginBottom: 16 }}>You haven't applied to any jobs yet.</p>
                  <button onClick={() => setTab('jobs')} style={{ background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Briefcase size={14} /> Browse Jobs
                  </button>
                </div>
              ) : (
                appliedJobs.map(({ jobId, jobTitle }) => (
                  <MyRankingCard key={jobId} jobId={jobId} jobTitle={jobTitle} />
                ))
              )}
            </div>
          )}
 
          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 480 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>My Profile</h1>
 
              <div style={{ background: 'rgba(26,26,38,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 14 }}>
                <div style={{ width: 68, height: 68, borderRadius: 18, background: 'rgba(108,99,255,0.18)', border: '2px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 26, fontWeight: 800, color: '#6C63FF' }}>{initial}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#E8E8F0' }}>{user?.full_name}</div>
                <div style={{ color: '#9090A8', fontSize: 13, marginTop: 4 }}>{user?.email}</div>
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 20, background: 'rgba(108,99,255,0.12)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.2)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Shield size={11} /> {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
 
              <div style={{ background: 'rgba(26,26,38,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, color: '#E8E8F0', marginBottom: 14, fontSize: 14 }}>Account Info</div>
                {[['Full Name', user?.full_name, User], ['Email', user?.email, Mail], ['Role', user?.role?.replace('_', ' '), Shield]].map(([label, val, Icon]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <Icon size={14} color="#9090A8" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: '#9090A8', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: '#E8E8F0', textTransform: label === 'Role' ? 'capitalize' : 'none' }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>
 
              <div style={{ background: 'rgba(26,26,38,0.85)', border: '1px solid rgba(255,77,109,0.15)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 600, color: '#FF4D6D', marginBottom: 14, fontSize: 14 }}>Danger Zone</div>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#FF4D6D', background: 'none', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 10, padding: '9px 18px', cursor: 'pointer' }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
 
      {/* Upload Modal */}
      {uploadJob && (
        <UploadModal
          job={uploadJob}
          onClose={() => setUploadJob(null)}
          onUploaded={handleUploaded}
        />
      )}
    </>
  )
}
 