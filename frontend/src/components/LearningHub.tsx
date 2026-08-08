import type { ReactNode } from 'react'
import { Award, BookOpen, Flame, Share2, Target, Trophy } from 'lucide-react'
import type { Review } from '../lib/api'

export type Progress = { reviews: number; streak: number; xp: number; languages: string[] }
const challenges = [
  {
    title: 'Remove duplicate values',
    level: 'Beginner',
    language: 'python',
    code: `def remove_duplicates(items):\n    result = []\n    for item in items:\n        if item not in result:\n            result.append(item)\n    return result`,
  },
  {
    title: 'Fix the unsafe query',
    level: 'Intermediate',
    language: 'python',
    code: `user_id = input("User ID: ")\nquery = "SELECT * FROM users WHERE id = " + user_id\ncursor.execute(query)`,
  },
  {
    title: 'Find the faster approach',
    level: 'Intermediate',
    language: 'java',
    code: `public static boolean contains(int[] values, int target) {\n  for (int i = 0; i < values.length; i++) {\n    for (int j = 0; j < values.length; j++) {\n      if (values[j] == target) return true;\n    }\n  }\n  return false;\n}`,
  },
]
export function LearningHub({
  review,
  reviewId,
  progress,
  onChallenge,
}: {
  review: Review | null
  reviewId: number | null
  progress: Progress
  onChallenge: (code: string, language: string, title: string) => void
}) {
  const share = async () => {
    if (!reviewId) return
    const url = `${window.location.origin}${window.location.pathname}?review=${reviewId}`
    await navigator.clipboard.writeText(url)
    alert('Share link copied to your clipboard!')
  }
  const next = review?.complexity.time.includes('Depends')
    ? 'Practice identifying loops and using hash maps.'
    : review?.optimizations[0] || 'Write a small test for the code you just reviewed.'
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen size={17} className="text-cyan-300" />
              Your learning path
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Turn every review into practical progress.
            </p>
          </div>
          {reviewId && (
            <button
              onClick={share}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
            >
              <Share2 size={14} />
              Share review
            </button>
          )}
        </div>
        {review ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Lesson
              title="What you did well"
              text={
                Object.entries(review.metrics)
                  .filter(([, n]) => n >= 80)
                  .slice(0, 2)
                  .map(([x]) => x.replace('_', ' '))
                  .join(' and ') || 'You submitted code for a thoughtful review.'
              }
            />
            <Lesson title="Learn next" text={next} />
            <Lesson title="Why it matters" text={review.explanation.purpose} />
            <Lesson
              title="Try this now"
              text={review.improvements[0] || 'Refactor one part, then review it again.'}
            />
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-white/5 p-4 text-sm text-slate-400">
            Complete a review to receive a personalised learning path.
          </p>
        )}
      </section>
      <section className="glass rounded-2xl p-5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Trophy size={17} className="text-amber-300" />
          Learning progress
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat icon={<Target size={17} />} value={progress.reviews} label="Reviews" />
          <Stat icon={<Flame size={17} />} value={progress.streak} label="Day streak" />
          <Stat icon={<Award size={17} />} value={progress.xp} label="XP" />
        </div>
        <div className="mt-5">
          <p className="text-xs text-slate-400">Badges</p>
          <div className="mt-2 flex gap-2">
            {[
              ['First review', progress.reviews >= 1],
              ['Explorer', progress.languages.length >= 2],
              ['Dedicated', progress.reviews >= 5],
            ].map(([name, earned]) => (
              <span
                key={String(name)}
                className={`rounded-full px-2 py-1 text-xs ${earned ? 'bg-amber-300/15 text-amber-200' : 'bg-white/5 text-slate-500'}`}
              >
                {earned ? '✦ ' : '○ '}
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="glass rounded-2xl p-5 xl:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Target size={17} className="text-violet-300" />
              Daily practice lab
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Choose a short challenge, solve it, then ask the reviewer for feedback.
            </p>
          </div>
          <span className="rounded-full bg-violet-300/10 px-2 py-1 text-xs text-violet-200">
            3 challenges
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {challenges.map((x) => (
            <button
              key={x.title}
              onClick={() => onChallenge(x.code, x.language, x.title)}
              className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-violet-300/5"
            >
              <span className="text-xs text-violet-200">
                {x.level} · {x.language}
              </span>
              <p className="mt-2 text-sm font-medium">{x.title}</p>
              <p className="mt-2 text-xs text-slate-400">Load challenge →</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <span className="mx-auto block w-fit text-violet-300">{icon}</span>
      <p className="mt-1 text-lg font-bold">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  )
}
function Lesson({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-xs font-semibold text-violet-200">{title}</p>
      <p className="mt-1 text-sm leading-5 text-slate-300">{text}</p>
    </div>
  )
}
