import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Brain, Target, BarChart2, Shield, ChevronRight } from 'lucide-react'
 
const features = [
  { icon: Brain, title: 'BERT-Powered Matching', desc: 'Semantic similarity via Sentence-BERT compares resumes against JDs at the meaning level — not just keywords.' },
  { icon: Target, title: 'FAISS Vector Search', desc: 'Lightning-fast similarity search across thousands of embeddings using FAISS.' },
  { icon: BarChart2, title: 'Ranked Scorecards', desc: 'Every candidate gets a transparent score with skill breakdown, experience match, and education fit.' },
  { icon: Zap, title: 'spaCy NER Extraction', desc: 'Automatically extracts skills, education, job titles, and years of experience from unstructured text.' },
  { icon: Shield, title: 'Bias Reduction', desc: 'Skill-first ranking minimizes unconscious bias — objective data drives decisions.' },
  { icon: Target, title: 'Bulk Upload', desc: 'Process hundreds of resumes at once. Upload PDFs or DOCX files — we handle the rest.' },
]
 
export default function HeroPage() {
  return (
    <div className="min-h-screen bg-obsidian overflow-x-hidden">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 radial-glow pointer-events-none" />
 
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center electric-glow">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-mist text-lg">RecruitAI</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-ghost">
          <a href="#features" className="hover:text-mist transition-colors">Features</a>
          <a href="#how" className="hover:text-mist transition-colors">How it works</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/signin" className="text-sm text-ghost hover:text-mist transition-colors px-4 py-2">Sign In</Link>
          <Link to="/register" className="flex items-center gap-2 bg-volt text-obsidian text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all volt-glow">
            Get Started <ArrowRight size={15} />
          </Link>
        </div>
      </nav>
 
      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-28 pb-20 text-center">
        <div className="inline-flex items-center gap-2 border border-electric/20 rounded-full px-4 py-1.5 mb-8" style={{ background: 'rgba(108,99,255,0.1)' }}>
          <span className="w-2 h-2 bg-volt rounded-full animate-pulse"></span>
          <span className="text-electric text-xs font-mono tracking-wider uppercase">AI-Powered Screening</span>
        </div>
        <h1 className="text-6xl leading-tight font-bold text-mist mb-6">
          Screen Smarter.<br />
          <span className="text-gradient">Rank Faster.</span><br />
          Hire Better.
        </h1>
        <p className="text-ghost text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          RecruitAI uses BERT semantic embeddings, spaCy NER, and FAISS similarity search to instantly rank candidates with transparent, explainable scores.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="flex items-center gap-2 bg-volt text-obsidian font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all volt-glow text-base">
            Start Screening Free <ArrowRight size={16} />
          </Link>
          <Link to="/signin" className="flex items-center gap-2 glass text-mist px-7 py-3.5 rounded-xl transition-all text-base">
            Sign In
          </Link>
        </div>
        <div className="mt-20 grid grid-cols-3 gap-6 max-w-xl mx-auto">
          {[['10x', 'Faster Screening'], ['94%', 'Match Accuracy'], ['∞', 'Candidates / Job']].map(([val, label]) => (
            <div key={label} className="glass rounded-2xl p-5">
              <div className="text-3xl font-bold text-volt">{val}</div>
              <div className="text-ghost text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>
 
      {/* Mock dashboard preview */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-28">
        <div className="glass rounded-2xl overflow-hidden border border-electric/10 electric-glow">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-danger/60"></div>
            <div className="w-3 h-3 rounded-full bg-amber/60"></div>
            <div className="w-3 h-3 rounded-full bg-neon/60"></div>
            <span className="text-ghost text-xs font-mono ml-3">recruitai.app/dashboard</span>
          </div>
          <div className="p-6 grid grid-cols-4 gap-4">
            {[['547', 'Candidates'], ['339', 'Jobs Active'], ['147', 'Screened Today'], ['89.75%', 'Avg Match']].map(([v, l]) => (
              <div key={l} className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(37,37,53,0.5)' }}>
                <p className="text-2xl text-mist font-bold">{v}</p>
                <p className="text-ghost text-xs mt-1">{l}</p>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 grid grid-cols-3 gap-3">
            {[['Senior React Developer', '94%'], ['ML Engineer', '87%'], ['Product Designer', '82%']].map(([title, score]) => (
              <div key={title} className="rounded-xl p-3 border border-white/5 flex items-center justify-between" style={{ background: 'rgba(26,26,38,0.8)' }}>
                <span className="text-mist text-xs">{title}</span>
                <span className="text-volt text-xs font-mono font-bold">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Features */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-8 pb-28">
        <h2 className="text-4xl font-bold text-mist text-center mb-3">Built on cutting-edge NLP</h2>
        <p className="text-ghost text-center mb-12">Every layer of the stack is purpose-built for talent intelligence.</p>
        <div className="grid grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-6 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(108,99,255,0.1)' }}>
                <Icon size={18} className="text-electric" />
              </div>
              <h3 className="text-base font-semibold text-mist mb-2">{title}</h3>
              <p className="text-ghost text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
 
      {/* CTA */}
      <section id="how" className="relative z-10 max-w-5xl mx-auto px-8 pb-28">
        <div className="glass rounded-3xl p-12 text-center" style={{ border: '1px solid rgba(200,255,0,0.1)' }}>
          <h2 className="text-4xl font-bold text-mist mb-4">Ready to transform your hiring?</h2>
          <p className="text-ghost mb-8">Join teams already screening smarter with RecruitAI.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-volt text-obsidian font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-all volt-glow">
            Create Free Account <ChevronRight size={16} />
          </Link>
        </div>
      </section>
 
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-6 flex items-center justify-between text-ghost text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-electric flex items-center justify-center">
            <span className="text-white font-bold text-xs">R</span>
          </div>
          <span>RecruitAI © 2026</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-mist transition-colors">Privacy</a>
          <a href="#" className="hover:text-mist transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  )
}
 