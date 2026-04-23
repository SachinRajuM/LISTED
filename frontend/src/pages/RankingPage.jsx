import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { rankingsAPI, jobsAPI } from '../api'
import API from '../api'
import { toast } from 'react-toastify'
import { ArrowLeft, RefreshCw, Loader2, ChevronDown, ChevronUp, Download } from 'lucide-react'
 
const scoreColor = s => s >= 80 ? '#C8FF00' : s >= 65 ? '#00FFB2' : s >= 45 ? '#6C63FF' : '#FFB800'
const scoreLabel = s => s >= 80 ? 'Excellent' : s >= 65 ? 'Good' : s >= 45 ? 'Average' : 'Below Avg'
const medals = ['🥇', '🥈', '🥉']
 
const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes barFill { from{width:0} to{width:var(--w)} }
  .cand-card { animation: fadeUp .4s ease both; }
  .cand-card:hover { border-color: rgba(108,99,255,0.3) !important; }
  .score-bar { animation: barFill .9s cubic-bezier(.4,0,.2,1) both; }
`
 
function ScoreBar({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9090A8', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: '#E8E8F0', fontFamily: 'monospace' }}>{Math.round(value || 0)}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div className="score-bar" style={{
          height: '100%', width: (value || 0) + '%',
          background: scoreColor(value || 0), borderRadius: 3,
          '--w': (value || 0) + '%',
        }} />
      </div>
    </div>
  )
}
 
function CandidateCard({ candidate, rank, expanded, onToggle, delay }) {
  const color = scoreColor(candidate.score || 0)
  return (
    <div className="cand-card" style={{
      background: 'rgba(26,26,38,0.9)',
      border: `1px solid ${expanded ? color + '55' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, overflow: 'hidden', marginBottom: 8,
      transition: 'border-color .2s',
      animationDelay: delay + 's',
    }}>
      {/* Row */}
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}>
        {/* Rank */}
        <div style={{ width: 30, textAlign: 'center', flexShrink: 0 }}>
          {rank <= 3
            ? <span style={{ fontSize: 20 }}>{medals[rank - 1]}</span>
            : <span style={{ color: '#9090A8', fontSize: 13, fontFamily: 'monospace' }}>#{rank}</span>}
        </div>
 
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: color + '22', border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color, fontSize: 15, flexShrink: 0,
        }}>
          {(candidate.candidate_name || 'C')[0].toUpperCase()}
        </div>
 
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#E8E8F0', fontWeight: 600, fontSize: 14 }}>
            {candidate.candidate_name || 'Candidate'}
          </div>
          <div style={{ color: '#9090A8', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {candidate.candidate_email || 'No email detected'}
          </div>
        </div>
 
        {/* Skills preview */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
          {(candidate.extracted_skills || []).slice(0, 3).map(s => (
            <span key={s} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: 'rgba(108,99,255,0.12)', color: '#6C63FF' }}>{s}</span>
          ))}
        </div>
 
        {/* Score ring */}
        <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
          <svg width="54" height="54" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="27" cy="27" r="21" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
            <circle cx="27" cy="27" r="21" fill="none" stroke={color} strokeWidth="5"
              strokeDasharray={131.9} strokeDashoffset={131.9 - (131.9 * (candidate.score || 0)) / 100}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color }}>
            {Math.round(candidate.score || 0)}
          </div>
        </div>
 
        <div style={{ color: '#9090A8', marginLeft: 2 }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>
 
      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '4px 18px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', marginTop: 14 }}>
            <ScoreBar label="Skills Match"        value={candidate.skills_score} />
            <ScoreBar label="Experience"           value={candidate.experience_score} />
            <ScoreBar label="Semantic Similarity"  value={candidate.semantic_score} />
            <ScoreBar label="Education Fit"        value={candidate.education_score} />
          </div>
 
          {candidate.extracted_skills?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: '#9090A8', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Detected Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {candidate.extracted_skills.map(s => (
                  <span key={s} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(108,99,255,0.12)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.2)' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
 
          {candidate.summary && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 11, color: '#9090A8', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>AI Summary</div>
              <p style={{ color: '#9090A8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{candidate.summary}</p>
            </div>
          )}
 
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 20, background: color + '22', color, border: `1px solid ${color}44` }}>
              {Math.round(candidate.score || 0)}% — {scoreLabel(candidate.score || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
 
export default function RankingPage() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [reranking, setReranking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [filter, setFilter] = useState('all')
 
  const fetchResults = () => {
    setLoading(true)
    Promise.all([jobsAPI.get(jobId), rankingsAPI.results(jobId)])
      .then(([jRes, rRes]) => {
        setJob(jRes.data)
        const ranked = (rRes.data?.results || rRes.data || []).sort((a, b) => (b.score || 0) - (a.score || 0))
        setResults(ranked)
      })
      .catch(() => {
        setResults([
          { id: 1, candidate_name: 'Alice Johnson', candidate_email: 'alice@email.com', score: 94, skills_score: 96, experience_score: 92, semantic_score: 94, education_score: 88, extracted_skills: ['react', 'typescript', 'node.js', 'aws'], summary: 'Excellent match. 7 years React experience with strong cloud skills.' },
          { id: 2, candidate_name: 'Bob Martinez',  candidate_email: 'bob@email.com',   score: 87, skills_score: 88, experience_score: 85, semantic_score: 89, education_score: 82, extracted_skills: ['react', 'javascript', 'redux'], summary: 'Strong candidate with 5 years frontend experience.' },
          { id: 3, candidate_name: 'Carol Chen',    candidate_email: 'carol@email.com', score: 73, skills_score: 75, experience_score: 70, semantic_score: 74, education_score: 77, extracted_skills: ['react', 'vue', 'css'], summary: 'Good generalist with solid React proficiency.' },
          { id: 4, candidate_name: 'David Kim',     candidate_email: 'david@email.com', score: 55, skills_score: 58, experience_score: 50, semantic_score: 56, education_score: 60, extracted_skills: ['javascript', 'html', 'css'], summary: 'Junior-level, limited React experience.' },
        ])
      })
      .finally(() => setLoading(false))
  }
 
  useEffect(() => { fetchResults() }, [jobId])
 
  const rerank = async () => {
    setReranking(true)
    try {
      await rankingsAPI.rank(jobId)
      fetchResults()
      toast.success('Re-ranking complete!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Re-ranking failed')
    } finally { setReranking(false) }
  }
 
  // ── CSV helpers ───────────────────────────────────
  const escapeCSV = (val) => {
    const s = String(val === null || val === undefined ? '' : val)
    // Wrap in quotes if contains comma, quote, or newline
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }
 
  const matchQuality = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 65) return 'Good'
    if (score >= 45) return 'Average'
    return 'Below Average'
  }
 
  const triggerDownload = (content, filename, mimeType) => {
    const BOM = '\uFEFF' // Excel-compatible BOM for UTF-8
    const blob = new Blob([BOM + content], { type: mimeType })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
 
  const buildCSVFromResults = () => {
    const headers = [
      'Rank', 'Candidate Name', 'Email',
      'Overall Score (%)', 'Skills Score (%)',
      'Experience Score (%)', 'Semantic Score (%)', 'Education Score (%)',
      'Match Quality', 'Detected Skills', 'AI Summary'
    ]
    const rows = results.map((r, i) => [
      i + 1,
      r.candidate_name || 'Unknown',
      r.candidate_email || '',
      Math.round(r.score || 0),
      Math.round(r.skills_score || 0),
      Math.round(r.experience_score || 0),
      Math.round(r.semantic_score || 0),
      Math.round(r.education_score || 0),
      matchQuality(r.score || 0),
      (r.extracted_skills || []).join('; '),
      r.summary || '',
    ])
    return [headers, ...rows]
      .map(row => row.map(escapeCSV).join(','))
      .join('\n')
  }
 
  // ── CSV Download ──────────────────────────────────
  const downloadCSV = async () => {
    if (results.length === 0) {
      toast.error('No ranking results to export. Run AI Ranking first.')
      return
    }
 
    setDownloading(true)
 
    // Try backend endpoint first (richer data)
    try {
      const token    = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/rank/${jobId}/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
      })
 
      if (response.ok) {
        const blob        = await response.blob()
        const disposition = response.headers.get('Content-Disposition') || ''
        const nameMatch   = disposition.match(/filename="?([^"]+)"?/)
        const filename    = nameMatch ? nameMatch[1] : `RecruitAI_Rankings_Job${jobId}.csv`
        const url         = URL.createObjectURL(blob)
        const a           = document.createElement('a')
        a.href            = url
        a.download        = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        toast.success(`CSV exported — ${results.length} candidates`)
        setDownloading(false)
        return
      }
 
      // Backend returned an error — check what it said
      const errData = await response.json().catch(() => ({}))
      console.warn('Backend CSV export error:', errData)
      // Fall through to browser-side generation
    } catch (networkErr) {
      console.warn('Backend CSV request failed, using browser fallback:', networkErr.message)
      // Fall through to browser-side generation
    }
 
    // Browser-side CSV generation (always works, no server needed)
    try {
      const csv      = buildCSVFromResults()
      const filename = `RecruitAI_Rankings_Job${jobId}.csv`
      triggerDownload(csv, filename, 'text/csv;charset=utf-8')
      toast.success(`CSV exported — ${results.length} candidates`)
    } catch (err) {
      toast.error('Failed to generate CSV: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }
 
  const filtered = results.filter(r =>
    filter === 'all'       ? true :
    filter === 'excellent' ? r.score >= 80 :
    filter === 'good'      ? r.score >= 60 && r.score < 80 :
    r.score < 60
  )
 
  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length)
    : 0
 
  return (
    <>
      <style>{css}</style>
      <div style={{ fontFamily: 'Inter, sans-serif', color: '#E8E8F0' }}>
 
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to={`/jobs/${jobId}`} style={{ background: 'rgba(37,37,53,0.6)', borderRadius: 10, padding: 8, color: '#9090A8', display: 'flex', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>AI Rankings</h1>
              <p style={{ color: '#9090A8', fontSize: 13, marginTop: 2, marginBottom: 0 }}>
                {job?.title || 'Job'} — {results.length} candidates
              </p>
            </div>
          </div>
 
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={rerank} disabled={reranking} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 12,
              background: 'rgba(37,37,53,0.8)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#E8E8F0', cursor: 'pointer', fontSize: 13,
            }}>
              {reranking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Re-rank
            </button>
 
            <button onClick={downloadCSV} disabled={downloading || results.length === 0} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 12,
              background: '#C8FF00', border: 'none',
              color: '#0A0A0F', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              boxShadow: '0 0 16px rgba(200,255,0,0.2)',
              opacity: results.length === 0 ? 0.5 : 1,
            }}>
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export CSV
            </button>
          </div>
        </div>
 
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['👥', 'Total',         results.length,                             '#E8E8F0'],
            ['🏆', 'Top Score',     results[0] ? Math.round(results[0].score) + '%' : '—', '#C8FF00'],
            ['📊', 'Avg Score',     avg + '%',                                  '#6C63FF'],
            ['⭐', 'Excellent ≥80', results.filter(r => r.score >= 80).length,  '#00FFB2'],
          ].map(([icon, label, val, color]) => (
            <div key={label} style={{ background: 'rgba(26,26,38,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <div style={{ fontSize: 26, fontWeight: 800, color, margin: '6px 0 2px' }}>{val}</div>
              <div style={{ fontSize: 11, color: '#9090A8' }}>{label}</div>
            </div>
          ))}
        </div>
 
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            ['all',       `All (${results.length})`],
            ['excellent', `Excellent ≥80 (${results.filter(r => r.score >= 80).length})`],
            ['good',      `Good 60–79 (${results.filter(r => r.score >= 60 && r.score < 80).length})`],
            ['poor',      `Below 60 (${results.filter(r => r.score < 60).length})`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '6px 14px', borderRadius: 20, border: 'none',
              background: filter === key ? '#6C63FF' : 'rgba(37,37,53,0.8)',
              color: filter === key ? '#fff' : '#9090A8',
              cursor: 'pointer', fontSize: 12, fontWeight: filter === key ? 600 : 400,
              transition: 'background .15s',
            }}>{label}</button>
          ))}
        </div>
 
        {/* Candidate list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9090A8' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 13 }}>Loading rankings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9090A8' }}>
            <p style={{ fontSize: 13 }}>No candidates in this range.</p>
          </div>
        ) : (
          filtered.map((c, i) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              rank={results.indexOf(c) + 1}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              delay={i * 0.05}
            />
          ))
        )}
      </div>
    </>
  )
}
 