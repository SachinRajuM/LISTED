import { useState, useEffect } from 'react'
import { analyticsAPI } from '../api'
import { toast } from 'react-toastify'
import { Shield, Trash2, Edit2, Loader2, TrendingUp, Users, Briefcase, BarChart3, Activity } from 'lucide-react'
 
const css = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-500px 0} 100%{background-position:500px 0} }
  @keyframes barRise { from{width:0} to{width:var(--w)} }
  @keyframes countUp { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes ringFill{ from{stroke-dashoffset:var(--total)} to{stroke-dashoffset:var(--offset)} }
  .admin-card { animation: fadeUp .45s ease both; }
  .admin-card:hover { border-color: rgba(108,99,255,0.2) !important; }
  .shimmer {
    background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.03) 75%);
    background-size:500px 100%; animation:shimmer 1.5s infinite;
  }
  .tr-row:hover td { background: rgba(108,99,255,0.05) !important; }
`
 
const ROLE_COLORS = {
  admin:          '#C8FF00',
  recruiter:      '#6C63FF',
  hiring_manager: '#00FFB2',
  end_user:       '#9090A8',
}
 
// Activity data — 7 days
const ACTIVITY = [
  { day:'Mon', uploads:24, rankings:8  },
  { day:'Tue', uploads:38, rankings:12 },
  { day:'Wed', uploads:19, rankings:6  },
  { day:'Thu', uploads:55, rankings:18 },
  { day:'Fri', uploads:42, rankings:14 },
  { day:'Sat', uploads:11, rankings:4  },
  { day:'Sun', uploads:7,  rankings:2  },
]
 
// ── Grouped bar chart ─────────────────────────────────
function ActivityChart({ data }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t) }, [])
  const maxU = Math.max(...data.map(d => d.uploads))
 
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:120, paddingBottom:20, position:'relative' }}>
      {data.map(({ day, uploads, rankings }, i) => (
        <div key={day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
          <div style={{ width:'100%', display:'flex', gap:2, alignItems:'flex-end', height:90 }}>
            {/* Uploads bar */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <div style={{
                borderRadius:'4px 4px 0 0', background:'#6C63FF',
                height: animated ? (uploads/maxU)*90 : 0,
                transition:`height .7s cubic-bezier(.4,0,.2,1) ${i*0.06}s`,
                boxShadow:'0 0 8px rgba(108,99,255,0.3)',
                minHeight: animated ? 3 : 0,
              }} />
            </div>
            {/* Rankings bar */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <div style={{
                borderRadius:'4px 4px 0 0', background:'#C8FF00',
                height: animated ? (rankings/maxU)*90 : 0,
                transition:`height .7s cubic-bezier(.4,0,.2,1) ${i*0.06+0.05}s`,
                boxShadow:'0 0 8px rgba(200,255,0,0.2)',
                minHeight: animated ? 3 : 0,
              }} />
            </div>
          </div>
          <span style={{ fontSize:9, color:'#9090A8', fontFamily:'monospace', position:'absolute', bottom:0 }}>{day}</span>
        </div>
      ))}
    </div>
  )
}
 
// ── Donut chart for roles ─────────────────────────────
function DonutChart({ data, total }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t) }, [])
 
  const R = 44, CIRC = 2 * Math.PI * R
  let offset = 0
  const segments = data.map(d => {
    const pct   = total > 0 ? d.value / total : 0
    const dash  = pct * CIRC
    const gap   = CIRC - dash
    const seg   = { ...d, dash, gap, offset, pct }
    offset += dash
    return seg
  })
 
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink:0 }}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        {segments.map((s, i) => (
          <circle key={s.name} cx="50" cy="50" r={R} fill="none"
            stroke={s.color} strokeWidth="10"
            strokeDasharray={animated ? `${s.dash} ${s.gap}` : `0 ${CIRC}`}
            strokeDashoffset={-(s.offset - CIRC/4)}
            strokeLinecap="butt"
            style={{ transition:`stroke-dasharray .8s cubic-bezier(.4,0,.2,1) ${i*0.1}s` }}
          />
        ))}
        <text x="50" y="46" textAnchor="middle" style={{ fontSize:16, fontWeight:800, fill:'#E8E8F0', fontFamily:'monospace' }}>{total}</text>
        <text x="50" y="60" textAnchor="middle" style={{ fontSize:8, fill:'#9090A8' }}>users</text>
      </svg>
      <div style={{ flex:1 }}>
        {segments.map(s => (
          <div key={s.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }} />
              <span style={{ fontSize:12, color:'#9090A8', textTransform:'capitalize' }}>{s.name.replace('_',' ')}</span>
            </div>
            <span style={{ fontSize:12, color:s.color, fontFamily:'monospace', fontWeight:700 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
 
export default function AdminPage() {
  const [users, setUsers]     = useState([])
  const [overview, setOverview] = useState({ total_users:0, total_jobs:0, total_resumes:0, total_rankings:0 })
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
 
  useEffect(() => {
    Promise.all([analyticsAPI.users(), analyticsAPI.overview()])
      .then(([u, o]) => { setUsers(u.data||[]); setOverview(o.data||{}) })
      .catch(() => {
        setUsers([
          { id:1, full_name:'Admin User',     email:'admin@recruitai.com',     role:'admin',          is_active:true, created_at:new Date().toISOString() },
          { id:2, full_name:'Jane Recruiter', email:'recruiter@recruitai.com', role:'recruiter',      is_active:true, created_at:new Date().toISOString() },
          { id:3, full_name:'Mark Manager',   email:'mark@company.com',        role:'hiring_manager', is_active:true, created_at:new Date().toISOString() },
          { id:4, full_name:'Alice Candidate',email:'alice@email.com',         role:'end_user',       is_active:true, created_at:new Date().toISOString() },
        ])
        setOverview({ total_users:4, total_jobs:8, total_resumes:143, total_rankings:97 })
      })
      .finally(() => setLoading(false))
  }, [])
 
  const updateRole = async (userId, role) => {
    try {
      await analyticsAPI.updateUserRole(userId, role)
      setUsers(users.map(u => u.id===userId ? {...u,role} : u))
      toast.success('Role updated')
      setEditingId(null)
    } catch { toast.error('Failed to update role') }
  }
 
  const deleteUser = async id => {
    if (!confirm('Delete this user?')) return
    try {
      await analyticsAPI.deleteUser(id)
      setUsers(users.filter(u => u.id!==id))
      toast.success('User deleted')
    } catch { toast.error('Failed to delete') }
  }
 
  // Role donut data
  const roleCounts = ['admin','recruiter','hiring_manager','end_user'].map(r => ({
    name: r, value: users.filter(u => u.role===r).length, color: ROLE_COLORS[r]
  }))
 
  const statCards = [
    { label:'Total Users',       value:overview.total_users,    color:'#6C63FF', Icon:Users     },
    { label:'Active Jobs',       value:overview.total_jobs,     color:'#C8FF00', Icon:Briefcase },
    { label:'Resumes Processed', value:overview.total_resumes,  color:'#00FFB2', Icon:BarChart3 },
    { label:'Rankings Run',      value:overview.total_rankings, color:'#FFB800', Icon:TrendingUp},
  ]
 
  return (
    <>
      <style>{css}</style>
      <div style={{ fontFamily:'Inter, sans-serif', color:'#E8E8F0' }}>
 
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, animation:'fadeUp .4s ease' }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'rgba(200,255,0,0.1)', border:'1px solid rgba(200,255,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={18} color="#C8FF00" />
          </div>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>Admin Panel</h1>
            <p style={{ color:'#9090A8', fontSize:13, marginTop:2, marginBottom:0 }}>System overview &amp; user management</p>
          </div>
        </div>
 
        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18 }}>
          {statCards.map(({ label, value, color, Icon }, i) => (
            <div key={label} className="admin-card" style={{
              background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:14, padding:18, transition:'border-color .2s',
              animationDelay: i*0.07+'s',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontSize:11, color:'#9090A8', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:1 }}>{label}</span>
                <div style={{ width:30, height:30, borderRadius:8, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={14} color={color} />
                </div>
              </div>
              <div className="countUp" style={{ fontSize:28, fontWeight:800, color:'#E8E8F0', animationDelay: i*0.1+'s' }}>
                {loading ? '…' : value}
              </div>
            </div>
          ))}
        </div>
 
        {/* Charts row */}
        <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14, marginBottom:18 }}>
 
          {/* Weekly Activity */}
          <div className="admin-card" style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, animationDelay:'.15s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#E8E8F0', display:'flex', alignItems:'center', gap:7 }}>
                  <Activity size={14} color="#6C63FF" /> Weekly Activity
                </div>
                <div style={{ fontSize:12, color:'#9090A8', marginTop:3 }}>Uploads &amp; rankings this week</div>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                {[['#6C63FF','Uploads'],['#C8FF00','Rankings']].map(([c,l]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#9090A8' }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:c }} />{l}
                  </div>
                ))}
              </div>
            </div>
 
            {/* Total this week */}
            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              {[
                ['Total Uploads',   ACTIVITY.reduce((a,d)=>a+d.uploads,0),  '#6C63FF'],
                ['Total Rankings',  ACTIVITY.reduce((a,d)=>a+d.rankings,0), '#C8FF00'],
                ['Avg Uploads/day', Math.round(ACTIVITY.reduce((a,d)=>a+d.uploads,0)/7), '#00FFB2'],
              ].map(([label,val,color]) => (
                <div key={label} style={{ flex:1, textAlign:'center', padding:'8px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                  <div style={{ fontSize:18, fontWeight:800, color, fontFamily:'monospace' }}>{val}</div>
                  <div style={{ fontSize:10, color:'#9090A8', marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>
 
            <ActivityChart data={ACTIVITY} />
          </div>
 
          {/* Role distribution */}
          <div className="admin-card" style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, animationDelay:'.2s' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#E8E8F0', marginBottom:4 }}>User Roles</div>
            <div style={{ fontSize:12, color:'#9090A8', marginBottom:18 }}>Distribution of account types</div>
            <DonutChart data={roleCounts} total={users.length} />
 
            {/* Role breakdown bars */}
            <div style={{ marginTop:16 }}>
              {roleCounts.map(({ name, value, color }) => {
                const pct = users.length > 0 ? Math.round((value/users.length)*100) : 0
                return (
                  <div key={name} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                      <span style={{ color:'#9090A8', textTransform:'capitalize' }}>{name.replace('_',' ')}</span>
                      <span style={{ color, fontFamily:'monospace' }}>{pct}%</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:color, width:pct+'%', borderRadius:2, transition:'width .8s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
 
        {/* Users table */}
        <div className="admin-card" style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden', animationDelay:'.25s' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#E8E8F0' }}>User Management</div>
            <span style={{ fontSize:12, color:'#9090A8' }}>{users.length} total users</span>
          </div>
 
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'#9090A8' }}>
              <Loader2 size={22} className="animate-spin" style={{ margin:'0 auto' }} />
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                    {['User','Email','Role','Joined','Status','Actions'].map(h => (
                      <th key={h} style={{ fontSize:10, color:'#9090A8', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:1, padding:'10px 16px', textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.06)', fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.id} className="tr-row" style={{ animationDelay: idx*0.05+'s' }}>
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:9, background:'rgba(108,99,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#6C63FF', fontSize:13, flexShrink:0 }}>
                            {user.full_name?.[0]}
                          </div>
                          <span style={{ fontSize:13, color:'#E8E8F0', fontWeight:500 }}>{user.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#9090A8', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{user.email}</td>
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        {editingId===user.id ? (
                          <select value={user.role} autoFocus onChange={e => updateRole(user.id, e.target.value)} onBlur={() => setEditingId(null)}
                            style={{ background:'#1A1A26', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'4px 8px', color:'#E8E8F0', fontSize:12, outline:'none' }}>
                            {['admin','recruiter','hiring_manager','end_user'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:(ROLE_COLORS[user.role]||'#9090A8')+'18', color:ROLE_COLORS[user.role]||'#9090A8', border:`1px solid ${(ROLE_COLORS[user.role]||'#9090A8')}30` }}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#9090A8', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:user.is_active?'rgba(0,255,178,0.1)':'rgba(255,77,109,0.1)', color:user.is_active?'#00FFB2':'#FF4D6D' }}>
                          {user.is_active?'Active':'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => setEditingId(user.id)} title="Edit role"
                            style={{ background:'none', border:'none', color:'#9090A8', cursor:'pointer', padding:5, borderRadius:6 }}
                            onMouseEnter={e=>e.currentTarget.style.color='#6C63FF'}
                            onMouseLeave={e=>e.currentTarget.style.color='#9090A8'}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => deleteUser(user.id)} title="Delete"
                            style={{ background:'none', border:'none', color:'#9090A8', cursor:'pointer', padding:5, borderRadius:6 }}
                            onMouseEnter={e=>e.currentTarget.style.color='#FF4D6D'}
                            onMouseLeave={e=>e.currentTarget.style.color='#9090A8'}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
 