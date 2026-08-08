import { useState } from 'react'
import { Clipboard, FlaskConical, LoaderCircle } from 'lucide-react'
import { generateTests } from '../lib/api'

export function TestLab({code,language}:{code:string;language:string}) {
  const [tests,setTests]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
  async function create(){setBusy(true);setError('');try{setTests((await generateTests(code,language)).tests)}catch(e){setError(e instanceof Error?e.message:'Could not create tests.')}finally{setBusy(false)}}
  return <section className="glass rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-semibold"><FlaskConical size={17} className="text-pink-300"/>AI test lab</p><p className="mt-1 text-xs text-slate-400">Generate meaningful tests, then adapt them as you learn.</p></div><button onClick={create} disabled={busy||!code.trim()} className="rounded-lg bg-pink-400/15 px-3 py-2 text-xs font-medium text-pink-200 hover:bg-pink-400/25 disabled:opacity-50">{busy?<LoaderCircle size={14} className="inline animate-spin"/>:'Generate tests'}</button></div>{error&&<p className="mt-3 text-xs text-rose-300">{error}</p>}{tests&&<div className="relative mt-4"><button onClick={()=>navigator.clipboard.writeText(tests)} className="absolute right-2 top-2 rounded p-1.5 text-slate-400 hover:bg-white/10" aria-label="Copy generated tests"><Clipboard size={14}/></button><pre className="max-h-72 overflow-auto rounded-xl border border-pink-300/15 bg-black/30 p-4 text-xs leading-5 text-pink-100">{tests}</pre></div>}</section>
}
