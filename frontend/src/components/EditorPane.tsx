import Editor from '@monaco-editor/react'
import { Clipboard, Eraser } from 'lucide-react'

export function EditorPane({code,setCode,language}:{code:string;setCode:(v:string)=>void;language:string}){
  return <section className="glass rounded-2xl overflow-hidden shadow-glow"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400"/><span className="h-2.5 w-2.5 rounded-full bg-amber-300"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/><span className="ml-2 text-sm font-medium muted">main.{language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : 'js'}</span></div><div className="flex gap-2"><button aria-label="Copy code" onClick={()=>navigator.clipboard.writeText(code)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Clipboard size={16}/></button><button aria-label="Clear code" onClick={()=>setCode('')} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Eraser size={16}/></button></div></div><Editor height="480px" language={language === 'cpp' ? 'cpp' : language} theme="vs-dark" value={code} onChange={(v)=>setCode(v || '')} options={{minimap:{enabled:false},fontSize:14,automaticLayout:true,padding:{top:16},scrollBeyondLastLine:false}}/></section>
}

