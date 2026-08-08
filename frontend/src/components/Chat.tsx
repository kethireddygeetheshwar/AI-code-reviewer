import { useState } from 'react'
import { Send } from 'lucide-react'
import { ask, type Review } from '../lib/api'
export function Chat({
  code,
  language,
  review,
}: {
  code: string
  language: string
  review: Review | null
}) {
  const [q, setQ] = useState('')
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim() || busy) return
    const question = q
    setQ('')
    setMessages((m) => [...m, { role: 'you', text: question }])
    setBusy(true)
    try {
      const r = await ask(question, code, language, review)
      setMessages((m) => [...m, { role: 'ai', text: r.answer }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'ai', text: 'I could not reach the reviewer. Try again shortly.' },
      ])
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold">Ask the reviewer</p>
      <div className="max-h-40 space-y-2 overflow-auto">
        {messages.map((m, i) => (
          <p
            key={i}
            className={`rounded-lg p-2 text-xs ${m.role === 'you' ? 'ml-8 bg-brand/20' : 'mr-4 bg-white/5 text-slate-300'}`}
          >
            {m.text}
          </p>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Why is this code inefficient?"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-brand"
        />
        <button className="btn-primary rounded-xl px-3" aria-label="Ask">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
