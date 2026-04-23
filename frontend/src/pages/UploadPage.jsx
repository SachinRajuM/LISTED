import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { resumesAPI } from '../api'
import { toast } from 'react-toastify'
import {
  Upload, FileText, X, CheckCircle, AlertCircle,
  ArrowLeft, Loader2, BarChart3, RefreshCw, Info
} from 'lucide-react'
 
const css = `
  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes barAnim  { from{width:0} to{width:var(--w)} }
 
  .file-row   { animation: slideIn .3s ease both; transition: background .15s; }
  .file-row:hover { background: rgba(108,99,255,0.06) !important; }
  .drop-zone  { transition: border-color .2s, background .2s, transform .1s; }
  .drop-zone:hover { border-color: rgba(108,99,255,0.4) !important; background: rgba(108,99,255,0.03) !important; }
  .drop-zone.active { border-color: #6C63FF !important; background: rgba(108,99,255,0.08) !important; transform: scale(1.005); }
  .upload-btn { transition: opacity .2s, transform .15s, box-shadow .2s; }
  .upload-btn:hover:not(:disabled) { opacity:.92; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(108,99,255,0.35); }
  .spin { animation: spin 1s linear infinite; }
  .tip-item { transition: background .15s; }
  .tip-item:hover { background: rgba(255,255,255,0.04) !important; }
`
 
const statusConfig = {
  pending:   { color: '#9090A8', label: 'Ready',       bg: 'rgba(144,144,168,0.1)'  },
  uploading: { color: '#6C63FF', label: 'Processing…', bg: 'rgba(108,99,255,0.1)'   },
  success:   { color: '#00FFB2', label: 'Uploaded',    bg: 'rgba(0,255,178,0.1)'    },
  error:     { color: '#FF4D6D', label: 'Failed',      bg: 'rgba(255,77,109,0.1)'   },
}
 
const TIPS = [
  { icon: '📄', title: 'Use text-based PDFs',      desc: 'Scanned image PDFs reduce NLP accuracy significantly' },
  { icon: '🏷️', title: 'Clear section headers',    desc: 'Skills, Experience, Education help spaCy extract entities' },
  { icon: '📊', title: 'Run AI Ranking after',     desc: 'Go to the job page and click "Run AI Ranking" to score' },
  { icon: '🧠', title: 'BERT understands context', desc: 'Semantic matching finds meaning, not just exact keywords' },
]
 
export default function UploadPage() {
  const { jobId } = useParams()
  const [files, setFiles]       = useState([])
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
 
  const onDrop = useCallback(accepted => {
    setErrorMsg('')
    const newFiles = accepted.map(f => ({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      file: f, name: f.name, size: f.size,
      status: 'pending', progress: 0, error: '',
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])
 
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: rejected => {
      rejected.forEach(({ file, errors }) => {
        const msg = errors[0]?.code === 'file-too-large'
          ? `${file.name} is too large — max 10MB`
          : `${file.name} rejected — PDF or DOCX only`
        toast.error(msg)
      })
    },
  })
 
  const removeFile = id => setFiles(f => f.filter(x => x.id !== id))
  const retryFile  = id => setFiles(f => f.map(x => x.id === id ? { ...x, status: 'pending', error: '', progress: 0 } : x))
 
  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending')
    if (!pending.length) { toast.info('No files queued to upload'); return }
    setUploading(true)
    setErrorMsg('')
    let successCount = 0
    let failCount    = 0
 
    for (const item of pending) {
      setFiles(f => f.map(x => x.id === item.id ? { ...x, status: 'uploading', progress: 0 } : x))
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        await resumesAPI.upload(fd, jobId, pct => {
          setFiles(f => f.map(x => x.id === item.id ? { ...x, progress: pct } : x))
        })
        setFiles(f => f.map(x => x.id === item.id ? { ...x, status: 'success', progress: 100 } : x))
        successCount++
      } catch (err) {
        const detail = err.response?.data?.detail || err.message || 'Upload failed'
        setFiles(f => f.map(x => x.id === item.id ? { ...x, status: 'error', error: detail } : x))
        failCount++
      }
    }
 
    setUploading(false)
    if (successCount > 0) toast.success(`${successCount} resume${successCount > 1 ? 's' : ''} uploaded successfully!`)
    if (failCount    > 0) {
      toast.error(`${failCount} file${failCount > 1 ? 's' : ''} failed — check errors below`)
      setErrorMsg(`${failCount} upload${failCount > 1 ? 's' : ''} failed. See details below each file.`)
    }
  }
 
  const fmt  = b => b < 1024*1024 ? (b/1024).toFixed(1)+' KB' : (b/1024/1024).toFixed(1)+' MB'
  const allDone = files.length > 0 && files.every(f => f.status === 'success')
  const pendingCount = files.filter(f => f.status === 'pending').length
  const doneCount    = files.filter(f => f.status === 'success').length
  const failedCount  = files.filter(f => f.status === 'error').length
 
  return (
    <>
      <style>{css}</style>
      <div style={{ fontFamily:'Inter, sans-serif', color:'#E8E8F0', maxWidth:660, margin:'0 auto' }}>
 
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:26, animation:'fadeUp .4s ease' }}>
          <Link to={`/jobs/${jobId}`} style={{ width:36, height:36, borderRadius:10, background:'rgba(37,37,53,0.6)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', color:'#9090A8', textDecoration:'none', flexShrink:0 }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>Upload Resumes</h1>
            <p style={{ color:'#9090A8', fontSize:13, marginTop:3, marginBottom:0 }}>PDF or DOCX · Max 10MB per file</p>
          </div>
          {files.length > 0 && (
            <div style={{ marginLeft:'auto', display:'flex', gap:12, fontSize:12, fontFamily:'monospace' }}>
              {doneCount  > 0 && <span style={{ color:'#00FFB2' }}>{doneCount} done</span>}
              {failedCount> 0 && <span style={{ color:'#FF4D6D' }}>{failedCount} failed</span>}
              {pendingCount>0 && <span style={{ color:'#9090A8' }}>{pendingCount} queued</span>}
            </div>
          )}
        </div>
 
        {/* Error banner */}
        {errorMsg && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(255,77,109,0.08)', border:'1px solid rgba(255,77,109,0.2)', borderRadius:12, marginBottom:16, animation:'fadeUp .3s ease' }}>
            <AlertCircle size={15} color="#FF4D6D" style={{ flexShrink:0 }} />
            <span style={{ fontSize:13, color:'#FF4D6D' }}>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} style={{ marginLeft:'auto', background:'none', border:'none', color:'#FF4D6D', cursor:'pointer', padding:2 }}><X size={13} /></button>
          </div>
        )}
 
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`drop-zone${isDragActive ? ' active' : ''}`}
          style={{
            border: `2px dashed ${isDragActive ? '#6C63FF' : 'rgba(255,255,255,0.1)'}`,
            borderRadius:18, padding:'44px 24px', textAlign:'center', cursor:'pointer',
            background: isDragActive ? 'rgba(108,99,255,0.08)' : 'rgba(255,255,255,0.01)',
            marginBottom:16,
          }}
        >
          <input {...getInputProps()} />
          <div style={{ width:56, height:56, borderRadius:16, background: isDragActive ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', transition:'background .2s' }}>
            <Upload size={24} color={isDragActive ? '#6C63FF' : '#9090A8'} />
          </div>
          {isDragActive ? (
            <p style={{ color:'#6C63FF', fontWeight:700, fontSize:16, margin:0 }}>Release to add files</p>
          ) : (
            <>
              <p style={{ color:'#E8E8F0', fontWeight:700, fontSize:15, margin:'0 0 6px' }}>Drag &amp; drop resumes here</p>
              <p style={{ color:'#9090A8', fontSize:13, margin:'0 0 18px' }}>or click anywhere to browse your files</p>
              <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
                {[['📄','PDF'],['📝','DOCX'],['⚡','Max 10MB'],['∞','Multiple files']].map(([icon,label]) => (
                  <span key={label} style={{ fontSize:11, padding:'4px 10px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'#9090A8', display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ fontSize:12 }}>{icon}</span>{label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
 
        {/* File list */}
        {files.length > 0 && (
          <div style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:16, marginBottom:14, animation:'fadeUp .3s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontWeight:600, color:'#E8E8F0', fontSize:14 }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </span>
              <button onClick={() => setFiles([])} disabled={uploading} style={{ background:'none', border:'none', color:'#9090A8', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                <X size={12} /> Clear all
              </button>
            </div>
 
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {files.map((f, i) => {
                const cfg = statusConfig[f.status]
                return (
                  <div key={f.id} className="file-row" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(37,37,53,0.4)', borderRadius:11, animationDelay: i*0.04+'s' }}>
                    {/* Icon */}
                    <div style={{ width:36, height:36, borderRadius:9, background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {f.status === 'uploading' ? <Loader2 size={16} color={cfg.color} className="spin" /> :
                       f.status === 'success'   ? <CheckCircle size={16} color="#00FFB2" /> :
                       f.status === 'error'     ? <AlertCircle size={16} color="#FF4D6D" /> :
                       <FileText size={16} color="#6C63FF" />}
                    </div>
 
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:'#E8E8F0', fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                        <span style={{ color:'#9090A8', fontSize:11 }}>{fmt(f.size)}</span>
                        {f.status === 'uploading' && (
                          <>
                            <div style={{ flex:1, maxWidth:120, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:f.progress+'%', background:'#6C63FF', borderRadius:2, transition:'width .3s' }} />
                            </div>
                            <span style={{ color:'#6C63FF', fontSize:11, fontFamily:'monospace' }}>{f.progress}%</span>
                          </>
                        )}
                        {f.status !== 'uploading' && (
                          <span style={{ color: cfg.color, fontSize:11, fontWeight:500 }}>
                            {f.status === 'error' ? (f.error || 'Upload failed') : cfg.label}
                          </span>
                        )}
                      </div>
                    </div>
 
                    {/* Actions */}
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      {f.status === 'error' && (
                        <button onClick={() => retryFile(f.id)} title="Retry" style={{ background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.2)', borderRadius:7, padding:'4px 8px', color:'#6C63FF', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', gap:3 }}>
                          <RefreshCw size={11} /> Retry
                        </button>
                      )}
                      {(f.status === 'pending' || f.status === 'error') && !uploading && (
                        <button onClick={() => removeFile(f.id)} title="Remove" style={{ background:'none', border:'none', color:'#9090A8', cursor:'pointer', padding:'4px 6px', borderRadius:6 }}
                          onMouseEnter={e => e.currentTarget.style.color='#FF4D6D'}
                          onMouseLeave={e => e.currentTarget.style.color='#9090A8'}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
 
        {/* Action buttons */}
        {files.length > 0 && (
          <div style={{ display:'flex', gap:10, marginBottom:20, animation:'fadeUp .3s ease .1s both' }}>
            {allDone ? (
              <Link to={`/ranking/${jobId}`} style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px', borderRadius:13, background:'#C8FF00', color:'#0A0A0F',
                fontWeight:700, fontSize:14, textDecoration:'none',
                boxShadow:'0 0 20px rgba(200,255,0,0.25)',
              }}>
                <BarChart3 size={16} /> View AI Rankings →
              </Link>
            ) : (
              <button onClick={uploadAll} disabled={uploading || pendingCount === 0} className="upload-btn" style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px', borderRadius:13, background:'#6C63FF', color:'#fff',
                fontWeight:700, fontSize:14, border:'none', cursor: pendingCount > 0 ? 'pointer' : 'not-allowed',
                opacity: pendingCount === 0 ? 0.5 : 1,
                boxShadow:'0 0 16px rgba(108,99,255,0.25)',
              }}>
                {uploading
                  ? <><Loader2 size={15} className="spin" /> Processing {files.filter(f=>f.status==='uploading').map(f=>f.name)[0]?.split('.')[0]}…</>
                  : <><Upload size={15} /> Upload {pendingCount} Resume{pendingCount !== 1 ? 's' : ''}</>
                }
              </button>
            )}
          </div>
        )}
 
        {/* Upload stats bar */}
        {files.length > 0 && (doneCount > 0 || failedCount > 0) && (
          <div style={{ background:'rgba(26,26,38,0.6)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 16px', marginBottom:20, animation:'fadeUp .3s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8 }}>
              <span style={{ color:'#9090A8' }}>Upload progress</span>
              <span style={{ color:'#E8E8F0', fontFamily:'monospace' }}>{doneCount}/{files.length}</span>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:3,
                background: failedCount > 0 ? 'linear-gradient(90deg,#6C63FF,#FF4D6D)' : '#6C63FF',
                width: (doneCount/files.length*100) + '%',
                transition:'width .5s ease',
              }} />
            </div>
          </div>
        )}
 
        {/* Tips */}
        <div style={{ background:'rgba(26,26,38,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden', animation:'fadeUp .4s ease .2s both' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:7 }}>
            <Info size={14} color="#6C63FF" />
            <span style={{ fontWeight:600, fontSize:14, color:'#E8E8F0' }}>Tips for best results</span>
          </div>
          {TIPS.map(({ icon, title, desc }, i) => (
            <div key={title} className="tip-item" style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 18px', borderBottom: i < TIPS.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#E8E8F0', marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:12, color:'#9090A8', lineHeight:1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
 
      </div>
    </>
  )
}
 