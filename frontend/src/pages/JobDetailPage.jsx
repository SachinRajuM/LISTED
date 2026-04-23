import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { jobsAPI, resumesAPI, rankingsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { Upload, BarChart3, Briefcase, MapPin, Clock, Users, ArrowLeft, Loader2, Play, ChevronRight } from 'lucide-react'
 
export default function JobDetailPage() {
  const { id } = useParams()
  const { isRecruiter } = useAuth()
  const [job, setJob] = useState(null)
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState(false)
 
  useEffect(() => {
    const fetch = async () => {
      try {
        const [jobRes, resumeRes] = await Promise.all([
          jobsAPI.get(id),
          resumesAPI.list(id)
        ])
        setJob(jobRes.data)
        setResumes(resumeRes.data.items || resumeRes.data || [])
      } catch {
        setJob({ id, title: 'Senior React Developer', department: 'Engineering', location: 'Remote', employment_type: 'full_time', description: 'We are looking for a senior React developer to join our team...', requirements: '5+ years React, TypeScript, Node.js', created_at: new Date().toISOString() })
        setResumes([])
      } finally { setLoading(false) }
    }
    fetch()
  }, [id])
 
  const triggerRanking = async () => {
    setRanking(true)
    try {
      await rankingsAPI.rank(id)
      toast.success('Ranking started! Results will be ready shortly.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start ranking')
    } finally { setRanking(false) }
  }
 
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-electric" />
    </div>
  )
 
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/jobs" className="p-2 rounded-xl bg-slate/50 text-ghost hover:text-mist transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-mist">{job?.title}</h1>
          <p className="text-ghost text-sm mt-0.5">{job?.department}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isRecruiter && (
            <>
              <Link
                to={`/upload/${id}`}
                className="flex items-center gap-2 glass border border-white/10 text-mist text-sm px-4 py-2.5 rounded-xl hover:border-electric/30 transition-all"
              >
                <Upload size={14} /> Upload Resumes
              </Link>
              <button
                onClick={triggerRanking}
                disabled={ranking || resumes.length === 0}
                className="flex items-center gap-2 bg-electric text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-electric/90 transition-all electric-glow disabled:opacity-50"
              >
                {ranking ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Run AI Ranking
              </button>
              <Link
                to={`/ranking/${id}`}
                className="flex items-center gap-2 bg-volt text-obsidian text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-volt/90 transition-all volt-glow"
              >
                <BarChart3 size={14} /> View Rankings
              </Link>
            </>
          )}
        </div>
      </div>
 
      <div className="grid grid-cols-3 gap-5">
        {/* Job Info */}
        <div className="col-span-2 space-y-5">
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-wrap gap-4 text-sm text-ghost mb-6 pb-6 border-b border-white/5">
              <span className="flex items-center gap-2"><MapPin size={14} />{job?.location || 'Remote'}</span>
              <span className="flex items-center gap-2"><Briefcase size={14} />{job?.employment_type?.replace('_', ' ')}</span>
              <span className="flex items-center gap-2"><Clock size={14} />Posted {new Date(job?.created_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-2"><Users size={14} />{resumes.length} applicants</span>
            </div>
            <h3 className="font-display font-semibold text-mist mb-3">Job Description</h3>
            <p className="text-ghost text-sm leading-relaxed whitespace-pre-wrap">{job?.description}</p>
            {job?.requirements && (
              <>
                <h3 className="font-display font-semibold text-mist mt-6 mb-3">Requirements</h3>
                <p className="text-ghost text-sm leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
              </>
            )}
          </div>
 
          {/* Resumes list */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-mist">Uploaded Resumes ({resumes.length})</h3>
              {isRecruiter && resumes.length > 0 && (
                <Link to={`/upload/${id}`} className="text-electric text-xs flex items-center gap-1 hover:underline">
                  Add more <ChevronRight size={12} />
                </Link>
              )}
            </div>
            {resumes.length === 0 ? (
              <div className="text-center py-10">
                <Upload size={32} className="text-ghost/30 mx-auto mb-3" />
                <p className="text-ghost text-sm">No resumes uploaded yet.</p>
                {isRecruiter && (
                  <Link to={`/upload/${id}`} className="inline-block mt-3 text-electric text-sm hover:underline">
                    Upload resumes →
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {resumes.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-slate/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center">
                        <span className="text-electric text-xs font-bold">{r.candidate_name?.[0] || 'R'}</span>
                      </div>
                      <div>
                        <p className="text-mist text-sm font-medium">{r.candidate_name || r.filename}</p>
                        <p className="text-ghost text-xs">{r.candidate_email || r.filename}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.score && (
                        <span className="text-volt text-sm font-mono font-bold">{r.score}%</span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full ${r.status === 'processed' ? 'text-neon bg-neon/10' : 'text-amber bg-amber/10'}`}>
                        {r.status || 'uploaded'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
 
        {/* Sidebar */}
        <div className="space-y-5">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-mist mb-4">Screening Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Resumes', value: resumes.length, color: 'text-mist' },
                { label: 'Processed', value: resumes.filter(r => r.status === 'processed').length, color: 'text-neon' },
                { label: 'Pending', value: resumes.filter(r => r.status !== 'processed').length, color: 'text-amber' },
                { label: 'Top Score', value: resumes.length > 0 ? Math.max(...resumes.map(r => r.score || 0)) + '%' : '—', color: 'text-volt' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-ghost text-sm">{label}</span>
                  <span className={`font-mono font-bold text-sm ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
 
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-mist mb-4">Actions</h3>
            <div className="space-y-2">
              <Link to={`/upload/${id}`} className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate/30 text-mist text-sm hover:bg-slate/60 transition-all">
                <Upload size={15} className="text-electric" /> Upload Resumes
              </Link>
              <Link to={`/ranking/${id}`} className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate/30 text-mist text-sm hover:bg-slate/60 transition-all">
                <BarChart3 size={15} className="text-volt" /> View Rankings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}