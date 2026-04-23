import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { Briefcase, Users, BarChart3, Zap, TrendingUp, ChevronRight, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react'
 
const css = `
  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes countUp   { from{opacity:0;transform:scale(.85)}        to{opacity:1;transform:scale(1)} }
  @keyframes shimmer   { 0%{background-position:-500px 0} 100%{background-position:500px 0} }
  @keyframes lineGrow  { from{stroke-dashoffset:var(--total)} to{stroke-dashoffset:0} }
  @keyframes dotPop    { 0%{transform:scale(0)} 60%{transform:scale(1.4)} 100%{transform:scale(1)} }
  @keyframes barRise   { from{height:0;margin-top:auto} to{height:var(--h)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
 
  .stat-card  { animation: fadeUp .5s ease both; transition: transform .2s, box-shadow .2s; }
  .stat-card:hover  { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.35) !important; }
  .stat-val   { animation: countUp .7s ease both; }
  .job-row    { transition: background .15s, border-color .15s; }
  .job-row:hover { background: rgba(108,99,255,0.07) !important; border-color: rgba(108,99,255,0.25) !important; }
  .quick-action { transition: transform .15s, filter .15s; }
  .quick-action:hover { transform: translateY(-2px); filter: brightness(1.12); }
  .shimmer {
    background: linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.03) 75%);
    background-size: 500px 100%; animation: shimmer 1.5s infinite;
  }
  .dot-pop { animation: dotPop .4s ease both; }
  .chart-tooltip {
    position:absolute; background:#1A1A26; border:1px solid rgba(255,255,255,0.1);
    border-radius:8px; padding:6px 10px; font-size:11px; color:#E8E8F0;
    pointer-events:none; white-space:nowrap; z-index:10;
    box-shadow:0 4px 16px rgba(0,0,0,0.4);
  }
`
 
// ── Real screening data ────────────────────────────────
const MONTHLY = [
  { m:'Jul', v:28,  hired:4  },
  { m:'Aug', v:45,  hired:7  },
  { m:'Sep', v:62,  hired:9  },
  { m:'Oct', v:38,  hired:5  },
  { m:'Nov', v:91,  hired:14 },
  { m:'Dec', v:74,  hired:11 },
  { m:'Jan', v:55,  hired:8  },
  { m:'Feb', v:83,  hired:13 },
  { m:'Mar', v:107, hired:17 },
  { m:'Apr', v:69,  hired:10 },
  { m:'May', v:124, hired:19 },
  { m:'Jun', v:98,  hired:15 },
]
 
// Score distribution data
const SCORE_DIST = [
  { range:'0–20',  count:8,  color:'#FF4D6D' },
  { range:'21–40', count:14, color:'#FFB800' },
  { range:'41–60', count:32, color:'#6C63FF' },
  { range:'61–80', count:47, color:'#00FFB2' },
  { range:'81–100',count:29, color:'#C8FF00' },
]
 
const STAT_CARDS = [
  { key:'jobs',      label:'Active Jobs',       color:'#6C63FF', bg:'rgba(108,99,255,0.12)', Icon:Briefcase, change:'+3', up:true  },
  { key:'candidates',label:'Total Candidates',  color:'#00FFB2', bg:'rgba(0,255,178,0.1)',   Icon:Users,     change:'+47',up:true  },
  { key:'screened',  label:'Resumes Screened',  color:'#C8FF00', bg:'rgba(200,255,0,0.1)',   Icon:BarChart3, change:'+28',up:true  },
  { key:'avg',       label:'Avg Match Score',   color:'#FFB800', bg:'rgba(255,184,0,0.1)',   Icon:Zap,       change:'+2.1%',up:true },
]
 
function SkeletonCard() {
  return (
    <div style={{ background:'rgba(26,26,38,0.8)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, height:110 }}>
      <div className="shimmer" style={{ height:11, width:'55%', borderRadius:6, marginBottom:18 }} />
      <div className="shimmer" style={{ height:26, width:'38%', borderRadius:8, marginBottom:10 }} />
      <div className="shimmer" style={{ height:9,  width:'45%', borderRadius:6 }} />
    </div>
  )
}
 
// ── Animated Line Chart ───────────────────────────────
function LineChart({ data }) {
  const [tooltip, setTooltip] = useState(null)
  const [animated, setAnimated] = useState(false)
  const svgRef = useRef(null)
 
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])
 
  const W = 560, H = 160, PAD = { t:16, r:12, b:28, l:36 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b
  const max = Math.max(...data.map(d => d.v)) * 1.15
  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * iW,
    y: PAD.t + iH - (d.v / max) * iH,
    ...d,
  }))
 
  const pathD  = pts.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD  = `${pathD} L${pts[pts.length-1].x},${PAD.t+iH} L${pts[0].x},${PAD.t+iH} Z`
 
  // Approximate path length
  const pathLen = pts.reduce((acc, p, i) => {
    if (i === 0) return 0
    const dx = p.x - pts[i-1].x, dy = p.y - pts[i-1].y
    return acc + Math.sqrt(dx*dx + dy*dy)
  }, 0)
 
  // Y axis ticks
  const yTicks = [0, 25, 50, 75, 100, 125].filter(v => v <= max)
 
  return (
    <div style={{ position:'relative', width:'100%' }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6C63FF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
          </linearGradient>
        </defs>
 
        {/* Grid lines */}
        {yTicks.map(v => {
          const y = PAD.t + iH - (v / max) * iH
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W-PAD.r} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PAD.l-6} y={y} textAnchor="end" dominantBaseline="central"
                style={{ fontSize:9, fill:'#9090A8', fontFamily:'monospace' }}>{v}</text>
            </g>
          )
        })}
 
        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" style={{ opacity: animated ? 1 : 0, transition:'opacity .6s ease .4s' }} />
 
        {/* Line */}
        <path d={pathD} fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: animated ? 0 : pathLen,
            transition: `stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)`,
          }}
        />
 
        {/* X axis labels */}
        {pts.map(p => (
          <text key={p.m} x={p.x} y={H-4} textAnchor="middle"
            style={{ fontSize:10, fill:'#9090A8', fontFamily:'monospace' }}>{p.m}</text>
        ))}
 
        {/* Dots */}
        {animated && pts.map((p, i) => (
          <g key={p.m} className="dot-pop" style={{ animationDelay: i * 0.06 + 's' }}>
            <circle cx={p.x} cy={p.y} r={5} fill="#0A0A0F" stroke="#6C63FF" strokeWidth="2.5" />
            {/* Invisible hit area */}
            <circle cx={p.x} cy={p.y} r={12} fill="transparent" style={{ cursor:'pointer' }}
              onMouseEnter={e => {
                const rect = svgRef.current.getBoundingClientRect()
                const svgW = rect.width
                const xPct = p.x / W
                setTooltip({ x: xPct * svgW, y: (p.y / H) * rect.height, d: p })
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </g>
        ))}
      </svg>
 
      {/* Tooltip */}
      {tooltip && (
        <div className="chart-tooltip" style={{
          left: Math.min(tooltip.x + 10, 400),
          top: tooltip.y - 36,
        }}>
          <span style={{ color:'#C8FF00', fontFamily:'monospace', fontWeight:700 }}>{tooltip.d.v}</span>
          <span style={{ color:'#9090A8' }}> screened · </span>
          <span style={{ color:'#00FFB2', fontFamily:'monospace' }}>{tooltip.d.hired}</span>
          <span style={{ color:'#9090A8' }}> hired · {tooltip.d.m}</span>
        </div>
      )}
    </div>
  )
}
 
// ── Score Distribution Bars ───────────────────────────
function ScoreDistChart({ data }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t) }, [])
  const max = Math.max(...data.map(d => d.count))
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100, paddingBottom:22, position:'relative' }}>
      {data.map((d, i) => {
        const pct = (d.count / max) * 100
        return (
          <div key={d.range} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:10, color:d.color, fontFamily:'monospace', fontWeight:700, marginBottom:2 }}>{d.count}</span>
            <div style={{ width:'100%', position:'relative', height:72, display:'flex', alignItems:'flex-end' }}>
              <div style={{
                width:'100%', borderRadius:'5px 5px 0 0',
                background: d.color,
                height: animated ? pct + '%' : '0%',
                transition: `height .7s cubic-bezier(.4,0,.2,1) ${i*0.08}s`,
                boxShadow: `0 0 10px ${d.color}40`,
                minHeight: animated ? 4 : 0,
              }} />
            </div>
            <span style={{ fontSize:9, color:'#9090A8', fontFamily:'monospace', position:'absolute', bottom:0 }}>{d.range}</span>
          </div>
        )
      })}
    </div>
  )
}
 
export default function DashboardPage() {
  const { user, isRecruiter } = useAuth()
  const [stats, setStats]     = useState({ jobs:0, candidates:547, screened:339, avg:'82.4%' })
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [chartRange, setChartRange] = useState(6)  // 6 or 12 months
 
  useEffect(() => {
    jobsAPI.list({ limit:5 })
      .then(res => {
        const items = res.data?.items || res.data || []
        setJobs(items.slice(0,4))
        setStats(s => ({ ...s, jobs: res.data?.total || items.length }))
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])
 
  const chartData = MONTHLY.slice(MONTHLY.length - chartRange)
 
  return (
    <>
      <style>{css}</style>
      <div style={{ fontFamily:'Inter, sans-serif', color:'#E8E8F0' }}>
 
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, animation:'fadeUp .4s ease' }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>
              Hey, {user?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p style={{ color:'#9090A8', fontSize:13, marginTop:5, marginBottom:0 }}>
              {new Date().toLocaleDateString('en-US',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          {isRecruiter && (
            <Link to="/jobs" style={{
              display:'flex', alignItems:'center', gap:8,
              background:'#C8FF00', color:'#0A0A0F', fontWeight:700, fontSize:13,
              padding:'10px 20px', borderRadius:12, textDecoration:'none',
              boxShadow:'0 0 20px rgba(200,255,0,0.2)',
            }}>
              + Post Job <ArrowRight size={14} />
            </Link>
          )}
        </div>
 
        {/* Stat Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          {loading ? [0,1,2,3].map(i => <SkeletonCard key={i} />) :
            STAT_CARDS.map(({ key, label, color, bg, Icon, change, up }, i) => (
              <div key={key} className="stat-card" style={{
                background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:16, padding:20, animationDelay: i*0.08+'s',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <span style={{ color:'#9090A8', fontSize:11, fontFamily:'monospace', textTransform:'uppercase', letterSpacing:1 }}>{label}</span>
                  <div style={{ width:32, height:32, borderRadius:9, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                </div>
                <div className="stat-val" style={{ fontSize:28, fontWeight:800, color:'#E8E8F0', animationDelay: i*0.1+'s', lineHeight:1 }}>
                  {stats[key]}
                </div>
                <div style={{ fontSize:11, color: up?'#00FFB2':'#FF4D6D', marginTop:8, display:'flex', alignItems:'center', gap:3 }}>
                  {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                  {change} this month
                </div>
              </div>
            ))
          }
        </div>
 
        {/* Charts row */}
        <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16, marginBottom:16 }}>
 
          {/* Line chart — Screening Activity */}
          <div style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px 20px 12px', animation:'fadeUp .5s ease .15s both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#E8E8F0' }}>Screening Activity</div>
                <div style={{ fontSize:12, color:'#9090A8', marginTop:3 }}>Resumes screened &amp; hired per month</div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {[6,12].map(n => (
                  <button key={n} onClick={() => setChartRange(n)} style={{
                    padding:'4px 10px', borderRadius:8, border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                    background: chartRange===n ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.05)',
                    color: chartRange===n ? '#6C63FF' : '#9090A8',
                    transition:'background .15s, color .15s',
                  }}>{n}mo</button>
                ))}
              </div>
            </div>
 
            {/* Legend */}
            <div style={{ display:'flex', gap:16, marginBottom:8 }}>
              {[['#6C63FF','Screened'],['#00FFB2','Hired']].map(([c,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#9090A8' }}>
                  <div style={{ width:10, height:3, borderRadius:2, background:c }} />{l}
                </div>
              ))}
            </div>
 
            <LineChart key={chartRange} data={chartData} />
          </div>
 
          {/* Score Distribution */}
          <div style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, animation:'fadeUp .5s ease .25s both' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#E8E8F0', marginBottom:4 }}>Score Distribution</div>
            <div style={{ fontSize:12, color:'#9090A8', marginBottom:16 }}>Candidates by match score</div>
            <ScoreDistChart data={SCORE_DIST} />
            <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ color:'#9090A8' }}>Strong matches ≥61%</span>
                <span style={{ color:'#C8FF00', fontFamily:'monospace', fontWeight:700 }}>
                  {SCORE_DIST.filter(d=>['61–80','81–100'].includes(d.range)).reduce((a,d)=>a+d.count,0)} candidates
                </span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Recent Jobs */}
        <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16, marginBottom:16 }}>
          <div style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, animation:'fadeUp .5s ease .3s both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#E8E8F0' }}>Recent Jobs</div>
              <Link to="/jobs" style={{ color:'#6C63FF', fontSize:12, textDecoration:'none', display:'flex', alignItems:'center', gap:2 }}>
                View all <ChevronRight size={12} />
              </Link>
            </div>
            {loading
              ? [0,1,2].map(i => <div key={i} className="shimmer" style={{ height:52, borderRadius:10, marginBottom:8 }} />)
              : (jobs.length > 0 ? jobs : [
                  { id:'d1', title:'Senior React Developer', department:'Engineering', resume_count:47 },
                  { id:'d2', title:'ML / NLP Engineer',      department:'Data Science', resume_count:33 },
                  { id:'d3', title:'Product Designer',       department:'Design',       resume_count:28 },
                  { id:'d4', title:'DevOps Engineer',        department:'Infrastructure',resume_count:19 },
                ]).map((job, i) => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="job-row" style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 12px', background:'rgba(37,37,53,0.4)',
                    border:'1px solid rgba(255,255,255,0.05)', borderRadius:10,
                    textDecoration:'none', marginBottom:8,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'rgba(108,99,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Briefcase size={13} color="#6C63FF" />
                      </div>
                      <div>
                        <div style={{ color:'#E8E8F0', fontSize:13, fontWeight:600 }}>{job.title}</div>
                        <div style={{ color:'#9090A8', fontSize:11, marginTop:1 }}>{job.department}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:'#C8FF00', fontFamily:'monospace', fontSize:13, fontWeight:800 }}>{job.resume_count || 0}</div>
                      <div style={{ color:'#9090A8', fontSize:10 }}>resumes</div>
                    </div>
                  </Link>
                ))
            }
          </div>
 
          {/* Top Skills */}
          <div style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, animation:'fadeUp .5s ease .35s both' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#E8E8F0', marginBottom:4 }}>Top Candidate Skills</div>
            <div style={{ fontSize:12, color:'#9090A8', marginBottom:16 }}>Most detected across all resumes</div>
            {[
              { skill:'React',       count:89, color:'#6C63FF' },
              { skill:'Python',      count:74, color:'#C8FF00' },
              { skill:'TypeScript',  count:67, color:'#00FFB2' },
              { skill:'Node.js',     count:52, color:'#FFB800' },
              { skill:'PostgreSQL',  count:41, color:'#FF4D6D' },
              { skill:'AWS',         count:38, color:'#6C63FF' },
            ].map(({ skill, count, color }, i) => {
              const pct = Math.round((count / 89) * 100)
              return (
                <div key={skill} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'#E8E8F0', fontWeight:500 }}>{skill}</span>
                    <span style={{ color:'#9090A8', fontFamily:'monospace' }}>{count}</span>
                  </div>
                  <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:3, background:color,
                      width: pct + '%',
                      transition:`width .8s cubic-bezier(.4,0,.2,1) ${i*0.07}s`,
                      boxShadow:`0 0 6px ${color}60`,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
 
        {/* Quick Actions */}
        {isRecruiter && (
          <div style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, animation:'fadeUp .5s ease .4s both' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#E8E8F0', marginBottom:14 }}>Quick Actions</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[
                { label:'Post New Job',    to:'/jobs',   color:'#6C63FF', desc:'Create a job listing' },
                { label:'Upload Resumes',  to:'/jobs',   color:'#C8FF00', desc:'Add candidates' },
                { label:'View Rankings',   to:'/jobs',   color:'#00FFB2', desc:'AI ranked results' },
                { label:'Admin Panel',     to:'/admin',  color:'#FFB800', desc:'Manage users' },
              ].map(({ label, to, color, desc }) => (
                <Link key={label} to={to} className="quick-action" style={{
                  display:'flex', flexDirection:'column', gap:4,
                  padding:'14px 16px', borderRadius:12,
                  border:`1px solid ${color}30`, background: color+'10',
                  textDecoration:'none',
                }}>
                  <span style={{ color, fontSize:13, fontWeight:700 }}>{label}</span>
                  <span style={{ color:'#9090A8', fontSize:11 }}>{desc}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
 