import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import {
  LayoutDashboard, Briefcase, User, Shield, LogOut,
  Bell, Search, ChevronRight, Home, CheckCheck, Info, AlertTriangle
} from 'lucide-react'
 
const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs',      icon: Briefcase,       label: 'Jobs'      },
  { to: '/profile',   icon: User,            label: 'My Profile'},
]
const ADMIN_NAV = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
]
 
// Sample notifications — in production fetch from API
const NOTIFICATIONS = [
  { id: 1, type: 'success', title: 'Ranking complete',   body: 'Senior React Dev — 5 candidates scored',  time: '2m ago',  read: false },
  { id: 2, type: 'info',    title: 'New resume uploaded', body: 'alice@email.com applied to ML Engineer',  time: '14m ago', read: false },
  { id: 3, type: 'warning', title: 'Resume failed',       body: 'corrupted_cv.pdf could not be processed', time: '1h ago',  read: true  },
  { id: 4, type: 'success', title: 'Job posted',          body: 'Product Designer is now live',            time: '3h ago',  read: true  },
]
 
const NOTIF_ICON  = { success: CheckCheck, info: Info, warning: AlertTriangle }
const NOTIF_COLOR = { success: '#00FFB2',  info: '#6C63FF', warning: '#FFB800' }
 
const css = `
  @keyframes fadeSlideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
  @keyframes dropDown     { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-dot    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.7} }
 
  .nav-link {
    display:flex; align-items:center; gap:10px; padding:9px 12px;
    border-radius:12px; font-size:13px; font-weight:500;
    text-decoration:none; color:#9090A8;
    transition:background .15s, color .15s;
    border: 1px solid transparent;
  }
  .nav-link:hover  { background:rgba(255,255,255,0.05); color:#E8E8F0; }
  .nav-link.active { background:rgba(108,99,255,0.12); color:#6C63FF; border-color:rgba(108,99,255,0.2); }
  .nav-link.admin-active { background:rgba(200,255,0,0.1); color:#C8FF00; border-color:rgba(200,255,0,0.2); }
  .sidebar-item    { animation: fadeSlideIn .3s ease both; }
 
  .notif-item:hover { background: rgba(255,255,255,0.04) !important; }
  .icon-btn:hover   { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.14) !important; }
`
 
export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed]       = useState(false)
  const [showNotifs, setShowNotifs]     = useState(false)
  const [notifs, setNotifs]             = useState(NOTIFICATIONS)
  const notifRef = useRef(null)
 
  const unread = notifs.filter(n => !n.read).length
 
  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
 
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })))
 
  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    navigate('/')
  }
 
  const initial = user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
 
  return (
    <>
      <style>{css}</style>
      <div style={{ display:'flex', minHeight:'100vh', background:'#0A0A0F', fontFamily:'Inter, sans-serif', color:'#E8E8F0' }}>
 
        {/* ── Sidebar ── */}
        <aside style={{
          width: collapsed ? 64 : 228, flexShrink: 0,
          background: '#111118', borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          transition: 'width .25s ease', position: 'relative', zIndex: 20,
        }}>
          {/* Logo */}
          <Link to="/" style={{
            height: 60, display: 'flex', alignItems: 'center',
            gap: 10, padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            textDecoration: 'none', overflow: 'hidden', flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: '#fff', fontSize: 16,
              boxShadow: '0 0 16px rgba(108,99,255,0.4)',
            }}>R</div>
            {!collapsed && <span style={{ fontWeight: 700, fontSize: 15, color: '#E8E8F0', whiteSpace: 'nowrap' }}>RecruitAI</span>}
          </Link>
 
          {/* Nav */}
          <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
            {NAV.map(({ to, icon: Icon, label }, i) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => 'nav-link sidebar-item' + (isActive ? ' active' : '')}
                style={{ animationDelay: i * 0.05 + 's' }}>
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
              </NavLink>
            ))}
 
            {isAdmin && (
              <>
                {!collapsed && (
                  <div style={{ fontSize: 10, color: 'rgba(144,144,168,0.45)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, padding: '12px 12px 4px' }}>
                    Admin
                  </div>
                )}
                {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} className={({ isActive }) => 'nav-link sidebar-item' + (isActive ? ' admin-active' : '')}>
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
                  </NavLink>
                ))}
              </>
            )}
 
            <Link to="/" className="nav-link sidebar-item" style={{ marginTop: 6 }}>
              <Home size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Home Page</span>}
            </Link>
          </nav>
 
          {/* User + Logout */}
          <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(108,99,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6C63FF', fontSize: 12, flexShrink: 0 }}>
                  {initial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#E8E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'User'}</div>
                  <div style={{ fontSize: 11, color: '#9090A8', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
                </div>
              </div>
            )}
            <button onClick={handleLogout} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 12, border: 'none',
              background: 'none', color: '#9090A8', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,77,109,0.1)'; e.currentTarget.style.color='#FF4D6D' }}
              onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#9090A8' }}
            >
              <LogOut size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
 
          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            position: 'absolute', right: -12, top: 80,
            width: 24, height: 24, borderRadius: '50%',
            background: '#1A1A26', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9090A8', zIndex: 30,
          }}>
            <ChevronRight size={12} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .25s' }} />
          </button>
        </aside>
 
        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
 
          {/* Top bar */}
          <header style={{
            height: 60, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px',
            background: 'rgba(17,17,24,0.85)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Search */}
            <div style={{ flex: 1, maxWidth: 300, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9090A8', pointerEvents: 'none' }} />
              <input placeholder="Search jobs, candidates..." style={{
                width: '100%', background: 'rgba(37,37,53,0.6)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                padding: '7px 14px 7px 32px', color: '#E8E8F0', fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
              }} />
            </div>
 
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
 
              {/* ── Notification Bell ── */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead() }}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: showNotifs ? 'rgba(108,99,255,0.15)' : 'rgba(37,37,53,0.6)',
                    border: `1px solid ${showNotifs ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: showNotifs ? '#6C63FF' : '#9090A8',
                    cursor: 'pointer', position: 'relative',
                    transition: 'background .15s, border-color .15s, color .15s',
                  }}
                >
                  <Bell size={16} />
                  {/* Badge — top-right OUTSIDE the bell icon */}
                  {unread > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -4, right: -4,
                      minWidth: 16, height: 16,
                      borderRadius: 8,
                      background: '#FF4D6D',
                      border: '2px solid #0A0A0F',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800, color: '#fff',
                      fontFamily: 'monospace',
                      animation: 'pulse-dot 2.5s ease-in-out infinite',
                      lineHeight: 1,
                      padding: '0 3px',
                    }}>
                      {unread}
                    </div>
                  )}
                </button>
 
                {/* Notification dropdown */}
                {showNotifs && (
                  <div style={{
                    position: 'absolute', top: 44, right: 0,
                    width: 320, background: '#111118',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    animation: 'dropDown .2s ease',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#E8E8F0' }}>Notifications</span>
                      <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#6C63FF', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                        Mark all read
                      </button>
                    </div>
 
                    {/* List */}
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifs.map(n => {
                        const Icon = NOTIF_ICON[n.type]
                        const color = NOTIF_COLOR[n.type]
                        return (
                          <div key={n.id} className="notif-item" style={{
                            display: 'flex', gap: 12, padding: '12px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: n.read ? 'transparent' : 'rgba(108,99,255,0.04)',
                            cursor: 'pointer', transition: 'background .15s',
                          }}>
                            {/* Icon */}
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                              <Icon size={14} color={color} />
                            </div>
                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: '#E8E8F0' }}>{n.title}</span>
                                <span style={{ fontSize: 10, color: '#9090A8', flexShrink: 0 }}>{n.time}</span>
                              </div>
                              <div style={{ fontSize: 12, color: '#9090A8', marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                            </div>
                            {/* Unread dot */}
                            {!n.read && (
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6C63FF', flexShrink: 0, marginTop: 6 }} />
                            )}
                          </div>
                        )
                      })}
                    </div>
 
                    {/* Footer */}
                    <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, color: '#9090A8' }}>
                        {notifs.filter(n => !n.read).length === 0 ? 'All caught up!' : `${notifs.filter(n => !n.read).length} unread`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
 
              {/* Avatar */}
              <Link to="/profile" style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: '#6C63FF', fontSize: 14, textDecoration: 'none',
              }}>{initial}</Link>
            </div>
          </header>
 
          {/* Page content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: 24, animation: 'fadeIn .3s ease' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
 