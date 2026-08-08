import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Code2, LoaderCircle, LockKeyhole, LogOut, Moon, Sparkles, Sun } from 'lucide-react'
import { AuthGate, type Profile } from './components/AuthGate'
import { Chat } from './components/Chat'
import { EditorPane } from './components/EditorPane'
import { LearningHub, type Progress } from './components/LearningHub'
import { MLLab } from './components/MLLab'
import { ReviewPanel } from './components/ReviewPanel'
import { TestLab } from './components/TestLab'
import { reviewCode, type Review } from './lib/api'
import { supabase } from './lib/supabase'

const example = `def find_duplicates(numbers):
    duplicates = []
    for item in numbers:
        if numbers.count(item) > 1:
            duplicates.append(item)
    return duplicates`
const languages = ['python', 'javascript', 'java', 'cpp']
const freshProgress: Progress = { reviews: 0, streak: 0, xp: 0, languages: [] }

export default function App() {
  const [code, setCode] = useState(example), [language, setLanguage] = useState('python'), [title, setTitle] = useState('Duplicate finder')
  const [review, setReview] = useState<Review | null>(null), [reviewId, setReviewId] = useState<number | null>(null), [loading, setLoading] = useState(false)
  const [error, setError] = useState(''), [dark, setDark] = useState(true), [progress, setProgress] = useState(freshProgress), [focus, setFocus] = useState('balanced'), [profile,setProfile] = useState<Profile|null>(null)
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({data}) => { const user=data.session?.user; if(user) setProfile({name:(user.user_metadata.name as string)||user.email!.split('@')[0],email:user.email!}) })
      const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{const user=session?.user;setProfile(user?{name:(user.user_metadata.name as string)||user.email!.split('@')[0],email:user.email!}:null)})
      return () => subscription.unsubscribe()
    }
    const stored = localStorage.getItem('reviewlens-progress'); if (stored) setProgress(JSON.parse(stored))
  }, [])
  useEffect(() => { document.documentElement.classList.toggle('light', !dark) }, [dark])
  function track(lang: string) { setProgress(old => { const next = { reviews: old.reviews + 1, streak: Math.max(1, old.streak), xp: old.xp + 25, languages: [...new Set([...old.languages, lang])] }; localStorage.setItem('reviewlens-progress', JSON.stringify(next)); return next }) }
  async function submit() {
    if (!code.trim()) return setError('Paste some code before requesting a review.')
    setLoading(true); setError('')
    try { const r = await reviewCode(code, language, title, focus); setReview(r.review); setReviewId(r.id); track(language) }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }
  function challenge(c: string, l: string, t: string) { setCode(c); setLanguage(l); setTitle(t); setReview(null); setReviewId(null); document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' }) }

  if (!profile) return <AuthGate onContinue={setProfile}/>
  return <div className="min-h-screen">
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-ink/80 px-5 py-4 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between"><a href="#top" className="flex items-center gap-2 font-bold"><span className="rounded-xl bg-brand/20 p-2 text-violet-300"><Code2 size={19}/></span>Review<span className="gradient-text">Lens</span></a><div className="flex items-center gap-3"><a href="#workspace" className="hidden text-sm text-slate-400 hover:text-white sm:block">Workspace</a><a href="#ml-lab" className="hidden text-sm text-slate-400 hover:text-white md:block">ML Lab</a><span className="hidden rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 sm:block">Hi, {profile.name}</span><button onClick={() => { supabase?.auth.signOut() }} className="rounded-lg p-2 text-slate-400 hover:bg-white/10" title="Sign out"><LogOut size={17}/></button><button onClick={() => setDark(!dark)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10" aria-label="Toggle theme">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button></div></div></nav>
    <main id="top"><section className="relative overflow-hidden px-5 pb-20 pt-24"><div className="orb orb-violet -left-24 top-10 h-72 w-72"/><div className="orb orb-cyan -right-20 top-40 h-80 w-80"/><div className="grid-bg absolute inset-0"/><div className="relative mx-auto max-w-5xl text-center"><motion.p initial={{opacity:0}} animate={{opacity:1}} className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-4 py-1.5 text-sm text-violet-200 backdrop-blur">✦ Learn faster. Ship safer code.</motion.p><motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Your AI-powered <span className="gradient-text">code review</span><br/>learning companion.</motion.h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">Understand every mistake, practice challenges, and turn feedback into developer confidence.</p><div className="mt-9 flex flex-wrap items-center justify-center gap-4"><a href="#workspace" className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold">Start learning free <ArrowRight size={18}/></a><a href="#ml-lab" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-200 transition hover:border-brand/40 hover:bg-white/10">Explore the ML lab</a></div><div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-3"><StatCard value="4+" label="Languages" icon={<Code2 size={16}/>}/><StatCard value="100%" label="AI-powered" icon={<Sparkles size={16}/>}/><StatCard value="Free" label="No credit card" icon={<LockKeyhole size={16}/>}/></div></div></section>
    <section className="mx-auto grid max-w-6xl gap-4 px-5 py-12 md:grid-cols-3">{[['Deep analysis','Find bugs, risks, and hidden edge cases.','🚀'],['Interactive fixes','Compare before and after code with clear explanations.','🛠️'],['Grow daily','Earn XP and work through focused coding challenges.','📈']].map(([h,p,e]) => <div key={h} className="glass glass-hover rounded-2xl p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-400/20 text-lg">{e}</div><h3 className="mt-4 font-display font-semibold">{h}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{p}</p></div>)}</section>
    <section id="workspace" className="mx-auto max-w-7xl px-5 pb-20"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-bold">Review workspace</h2><p className="mt-1 text-sm text-slate-400">Your personal coding coach, ready when you are.</p></div><div className="flex gap-2"><input value={title} onChange={e => setTitle(e.target.value)} className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" placeholder="Review title"/><select value={language} onChange={e => setLanguage(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">{languages.map(x => <option key={x}>{x}</option>)}</select><select value={focus} onChange={e => setFocus(e.target.value)} className="rounded-lg border border-violet-300/20 bg-violet-300/10 px-3 py-2 text-sm text-violet-100"><option value="balanced">Balanced mode</option><option value="mentor">Mentor mode</option><option value="security">Security audit</option><option value="performance">Performance mode</option></select><button onClick={submit} disabled={loading} className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={16}/> : <Code2 size={16}/>}Review code</button></div></div>
    {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}
    <div className="grid gap-5 lg:grid-cols-[1.25fr_.9fr]"><EditorPane code={code} setCode={setCode} language={language}/><div className="space-y-5"><ReviewPanel review={review as Review} reviewId={reviewId}/><Chat code={code} language={language} review={review}/></div></div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><LearningHub review={review} reviewId={reviewId} progress={progress} onChallenge={challenge}/><TestLab code={code} language={language}/></div><MLLab/>
    </section>
    <section className="border-y border-white/10 bg-brand/10 px-5 py-16 text-center"><h2 className="font-display text-3xl font-bold">Review with confidence. Learn by doing.</h2><p className="mt-3 text-slate-300">Fast insight. Better code. Real progress.</p></section></main><footer className="px-5 py-8 text-center text-sm text-slate-500">© 2026 ReviewLens · Built with FastAPI, React, Monaco, and AI.</footer>
  </div>
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return <div className="glass glass-hover rounded-2xl p-4 text-center"><span className="mx-auto mb-2 block w-fit rounded-lg bg-gradient-to-br from-violet-500/25 to-cyan-400/20 p-2 text-violet-200">{icon}</span><p className="font-display text-lg font-bold">{value}</p><p className="text-xs text-slate-400">{label}</p></div>
}
