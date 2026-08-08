import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  ShieldCheck,
  Sparkles,
  GitCompareArrows,
  GraduationCap,
} from 'lucide-react'
import type { Review } from '../lib/api'

const labels: Record<string, string> = {
  maintainability: 'Maintainability',
  readability: 'Readability',
  efficiency: 'Efficiency',
  security: 'Security',
  best_practices: 'Best practices',
}
export function ReviewPanel({ review, reviewId }: { review: Review; reviewId: number | null }) {
  if (!review)
    return (
      <section className="glass flex min-h-[480px] flex-col items-center justify-center rounded-2xl p-8 text-center">
        <div className="mb-5 rounded-2xl bg-brand/15 p-5 text-violet-300">
          <Sparkles size={32} />
        </div>
        <h3 className="text-lg font-semibold">Your expert review appears here</h3>
        <p className="mt-2 max-w-xs text-sm text-slate-400">
          Paste code, choose its language, and let ReviewLens find the details that matter.
        </p>
      </section>
    )
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-slate-400">Code quality</p>
            <div className="relative mt-2 h-20 w-20">
              <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
                <defs>
                  <linearGradient id="scoregrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a999ff" />
                    <stop offset="100%" stopColor="#59d8ff" />
                  </linearGradient>
                </defs>
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="rgba(255,255,255,.08)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="url(#scoregrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - review.score / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-2xl font-bold gradient-text">
                  {review.score}
                </span>
              </div>
            </div>
            <p className="mt-1 text-center text-xs text-slate-400">of 100</p>
          </div>
        </div>
        {reviewId && (
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reviews/${reviewId}/report`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 p-2 text-slate-300 hover:bg-white/10"
            title="Download PDF"
          >
            <Download size={18} />
          </a>
        )}
      </div>
      {review.provider_notice && (
        <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-200">
          {review.provider_notice}
        </p>
      )}
      <p className="mt-4 text-sm leading-6 text-slate-300">{review.summary}</p>
      <div className="mt-6 space-y-3">
        {Object.entries(review.metrics).map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="muted">{labels[key] || key}</span>
              <span>{value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
              />
            </div>
          </div>
        ))}
      </div>
      <Detail title="Issues found" icon={<AlertTriangle size={16} className="text-amber-300" />}>
        {review.bugs.length ? (
          review.bugs.map((b, i) => (
            <div key={i} className="rounded-lg bg-white/5 p-3 text-sm">
              <span className="mr-2 rounded bg-rose-400/15 px-1.5 py-0.5 text-xs text-rose-300">
                {b.severity}
              </span>
              <strong>{b.title}</strong>
              <p className="mt-1 text-xs text-slate-400">
                Line {b.line}: {b.explanation}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-emerald-300">No high-confidence bugs found.</p>
        )}
      </Detail>
      <Detail title="Complexity" icon={<Clock3 size={16} className="text-cyan-300" />}>
        <p className="text-sm">
          Time: <b>{review.complexity.time}</b> · Space: <b>{review.complexity.space}</b>
        </p>
        <p className="mt-1 text-xs text-slate-400">{review.complexity.explanation}</p>
      </Detail>
      <Detail title="Security" icon={<ShieldCheck size={16} className="text-emerald-300" />}>
        {review.security.map((x, i) => (
          <p key={i} className="text-sm text-slate-300">
            • {x}
          </p>
        ))}
      </Detail>
      <Detail title="Optimizations" icon={<CheckCircle2 size={16} className="text-violet-300" />}>
        {review.optimizations.map((x, i) => (
          <p key={i} className="text-sm text-slate-300">
            • {x}
          </p>
        ))}
      </Detail>
      <Detail title="Learn the logic" icon={<GraduationCap size={16} className="text-cyan-300" />}>
        <p className="text-sm text-slate-300">{review.explanation.purpose}</p>
        {review.explanation.functions.map((x, i) => (
          <p key={i} className="text-xs text-slate-400">
            • {x}
          </p>
        ))}
      </Detail>
      <Detail
        title="Before → improved code"
        icon={<GitCompareArrows size={16} className="text-violet-300" />}
      >
        <pre className="max-h-64 overflow-auto rounded-xl border border-emerald-300/15 bg-black/30 p-3 text-xs leading-5 text-emerald-200">
          {review.improved_code}
        </pre>
        {review.improvements.map((x, i) => (
          <p key={i} className="text-xs text-slate-400">
            ✓ {x}
          </p>
        ))}
      </Detail>
    </motion.section>
  )
}
function Detail({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
