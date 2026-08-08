import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, Eraser, LoaderCircle, Play, RotateCcw, Sigma, Trash2 } from 'lucide-react'
import {
  knn,
  leaveOneOutAccuracy,
  perceptronClassify,
  trainLinearRegression,
  trainPerceptron,
} from '../lib/ml'
import type { Point, Pt } from '../lib/ml'

const presets: { name: string; points: Pt[] }[] = [
  {
    name: 'Two clusters',
    points: [
      { id: 1, x: 20, y: 20, label: 0 },
      { id: 2, x: 26, y: 28, label: 0 },
      { id: 3, x: 14, y: 30, label: 0 },
      { id: 4, x: 28, y: 15, label: 0 },
      { id: 5, x: 80, y: 80, label: 1 },
      { id: 6, x: 74, y: 72, label: 1 },
      { id: 7, x: 86, y: 70, label: 1 },
      { id: 8, x: 72, y: 86, label: 1 },
    ],
  },
  {
    name: 'Ring',
    points: [
      { id: 9, x: 50, y: 50, label: 1 },
      { id: 10, x: 55, y: 47, label: 1 },
      { id: 11, x: 45, y: 54, label: 1 },
      { id: 12, x: 53, y: 56, label: 1 },
      { id: 13, x: 47, y: 45, label: 1 },
      { id: 14, x: 50, y: 27, label: 0 },
      { id: 15, x: 50, y: 73, label: 0 },
      { id: 16, x: 27, y: 50, label: 0 },
      { id: 17, x: 73, y: 50, label: 0 },
      { id: 18, x: 34, y: 34, label: 0 },
      { id: 19, x: 66, y: 66, label: 0 },
      { id: 20, x: 34, y: 66, label: 0 },
      { id: 21, x: 66, y: 34, label: 0 },
    ],
  },
  {
    name: 'Mixed',
    points: [
      { id: 22, x: 20, y: 30, label: 0 },
      { id: 23, x: 30, y: 20, label: 0 },
      { id: 24, x: 25, y: 55, label: 0 },
      { id: 25, x: 42, y: 34, label: 0 },
      { id: 26, x: 45, y: 60, label: 0 },
      { id: 27, x: 35, y: 70, label: 0 },
      { id: 28, x: 60, y: 25, label: 1 },
      { id: 29, x: 70, y: 45, label: 1 },
      { id: 30, x: 80, y: 30, label: 1 },
      { id: 31, x: 65, y: 65, label: 1 },
      { id: 32, x: 75, y: 78, label: 1 },
      { id: 33, x: 85, y: 55, label: 1 },
    ],
  },
]
const andPoints: Point[] = [
  { x: 0, y: 0, label: 0 },
  { x: 0, y: 1, label: 0 },
  { x: 1, y: 0, label: 0 },
  { x: 1, y: 1, label: 1 },
]
const regression: Point[] = [
  { x: 1, y: 2.8 },
  { x: 2, y: 4.9 },
  { x: 3, y: 6.7 },
  { x: 4, y: 9.2 },
  { x: 5, y: 10.9 },
  { x: 6, y: 13.1 },
]
let nextId = 1000

export function MLLab() {
  const [tab, setTab] = useState<'classification' | 'perceptron' | 'regression'>('classification')
  return (
    <section id="ml-lab" className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-violet-200">
            <BrainCircuit size={18} />
            Interactive ML Lab
          </p>
          <h2 className="font-display mt-1 text-2xl font-bold">
            Play with real models — no code, no installs.
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Place points, train a model, and watch it learn in your browser.
          </p>
        </div>
        <div className="flex rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setTab('classification')}
            className={`rounded-lg px-3 py-2 text-sm ${tab === 'classification' ? 'bg-violet-300/20 text-violet-100' : 'text-slate-400'}`}
          >
            Classification
          </button>
          <button
            onClick={() => setTab('perceptron')}
            className={`rounded-lg px-3 py-2 text-sm ${tab === 'perceptron' ? 'bg-violet-300/20 text-violet-100' : 'text-slate-400'}`}
          >
            Perceptron
          </button>
          <button
            onClick={() => setTab('regression')}
            className={`rounded-lg px-3 py-2 text-sm ${tab === 'regression' ? 'bg-violet-300/20 text-violet-100' : 'text-slate-400'}`}
          >
            Regression
          </button>
        </div>
      </div>
      {tab === 'classification' ? (
        <Classification />
      ) : tab === 'perceptron' ? (
        <Perceptron />
      ) : (
        <Regression />
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Concept
          title="Classification"
          accent="from-rose-400/30 to-rose-400/5"
          body="Sorts new points into groups by learning boundaries between them — like labelling spam vs. real email."
        />
        <Concept
          title="Regression"
          accent="from-cyan-400/30 to-cyan-400/5"
          body="Predicts a continuous number by fitting a line or curve — like forecasting tomorrow's temperature."
        />
        <Concept
          title="Perceptron"
          accent="from-violet-400/30 to-violet-400/5"
          body="A single artificial neuron that tunes its weights — the tiny seed behind every neural network."
        />
      </div>
    </section>
  )
}

function Classification() {
  const [points, setPoints] = useState<Pt[]>(presets[0].points)
  const [mode, setMode] = useState<'A' | 'B' | 'erase'>('A')
  const [k, setK] = useState(3)
  const [painted, setPainted] = useState(0)
  const [training, setTraining] = useState(false)
  const [pred, setPred] = useState<{ x: number; y: number; label: 0 | 1 } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
    },
    [],
  )

  function train() {
    if (points.length < 2) return
    setPred(null)
    setPainted(0)
    setTraining(true)
    if (timer.current) clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      setPainted((p) => {
        const next = Math.min(40, p + 2)
        if (next >= 40) {
          setTraining(false)
          if (timer.current) clearInterval(timer.current)
        }
        return next
      })
    }, 35)
  }

  const cells = useMemo(() => {
    const out: ReactNode[] = []
    if (!painted || !points.length) return out
    for (let cx = 0; cx < painted * 2.5; cx += 2.5) {
      for (let cy = 0; cy < 100; cy += 2.5) {
        const label = knn(points, cx + 1.25, cy + 1.25, k)
        out.push(
          <rect
            key={`${cx}-${cy}`}
            x={cx}
            y={100 - cy - 2.5}
            width={2.5}
            height={2.5}
            fill={label === 0 ? 'rgba(251,113,133,.26)' : 'rgba(56,189,248,.26)'}
          />,
        )
      }
    }
    return out
  }, [points, k, painted])

  const accuracy = useMemo(() => leaveOneOutAccuracy(points, k), [points, k])

  function pos(e: MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(1, Math.min(99, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(1, Math.min(99, ((r.bottom - e.clientY) / r.height) * 100)),
    }
  }
  function click(e: MouseEvent<SVGSVGElement>) {
    const { x, y } = pos(e)
    if (painted >= 40) {
      setPred({ x, y, label: knn(points, x, y, k) })
      return
    }
    if (mode === 'erase') {
      let bi = -1,
        bd = Infinity
      points.forEach((p, i) => {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2
        if (d < bd) {
          bd = d
          bi = i
        }
      })
      if (bd <= 64) setPoints((p) => p.filter((_, i) => i !== bi))
    } else {
      setPred(null)
      setPoints((p) =>
        p.length >= 60 ? p : [...p, { id: nextId++, x, y, label: mode === 'A' ? 0 : 1 }],
      )
    }
  }
  function reset(next: Pt[]) {
    setPoints(next)
    setPainted(0)
    setTraining(false)
    setPred(null)
  }

  const grid = Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map((v) => (
    <g key={v}>
      <line x1={v} y1={0} x2={v} y2={100} stroke="rgba(255,255,255,.05)" />
      <line x1={0} y1={v} x2={100} y2={v} stroke="rgba(255,255,255,.05)" />
    </g>
  ))

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Guess-the-rule classifier</p>
            <p className="mt-1 text-xs text-slate-400">
              Place your own points, train the model, then click anywhere to test a prediction.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode('A')} className={chip(mode === 'A', 'rose')}>
              <span className="h-2 w-2 rounded-full bg-rose-300" />
              Class A
            </button>
            <button onClick={() => setMode('B')} className={chip(mode === 'B', 'cyan')}>
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Class B
            </button>
            <button
              onClick={() => setMode('erase')}
              className={chip(mode === 'erase', 'slate')}
              aria-label="Erase points"
              title="Click a point to remove it"
            >
              <Eraser size={13} />
            </button>
          </div>
        </div>
        <div className="relative mt-4">
          <svg
            viewBox="0 0 100 100"
            onClick={click}
            className="w-full cursor-crosshair rounded-xl border border-white/10 bg-black/30"
            role="img"
            aria-label="Interactive classification canvas. Click to add points of the selected class, then train to see decision regions."
          >
            {grid}
            {cells}
            {points.map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={100 - p.y}
                r={3.2}
                fill={p.label === 0 ? '#fda4af' : '#67e8f9'}
                stroke="#0b1220"
                strokeWidth={1.4}
              >
                <title>{`(${Math.round(p.x)}, ${Math.round(p.y)}) class ${p.label === 0 ? 'A' : 'B'}`}</title>
              </circle>
            ))}
            {pred && (
              <g>
                <circle
                  cx={pred.x}
                  cy={100 - pred.y}
                  r={7}
                  fill="none"
                  stroke={pred.label === 0 ? '#fda4af' : '#67e8f9'}
                  strokeWidth={2.4}
                />
                <circle
                  cx={pred.x}
                  cy={100 - pred.y}
                  r={2.2}
                  fill={pred.label === 0 ? '#fda4af' : '#67e8f9'}
                />
              </g>
            )}
          </svg>
          <span className="pointer-events-none absolute right-3 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-slate-400">
            {painted >= 40
              ? 'click to predict'
              : mode === 'erase'
                ? 'click a point to remove'
                : 'click to add a point'}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
            Class A <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
            Class B
          </span>
          <span>{points.length} points on the canvas</span>
        </div>
      </div>
      <div className="space-y-5">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold">Training controls</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => reset(p.points)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                {p.name}
              </button>
            ))}
          </div>
          <label className="mt-5 block text-xs text-slate-400">
            Neighbours (k): <b>{k}</b>
            <input
              type="range"
              min={1}
              max={9}
              step={2}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="mt-2 w-full accent-violet-400"
            />
          </label>
          <button
            onClick={train}
            disabled={training || points.length < 2}
            className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {training ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} />}
            {training ? 'Training…' : 'Train classifier'}
          </button>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-rose-400/10 p-2 text-xs text-rose-200">
              Class A<br />
              <b className="text-sm">{points.filter((p) => p.label === 0).length}</b>
            </div>
            <div className="rounded-xl bg-cyan-400/10 p-2 text-xs text-cyan-200">
              Class B<br />
              <b className="text-sm">{points.filter((p) => p.label === 1).length}</b>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Model health</p>
            <button
              onClick={() => reset([])}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <Trash2 size={13} />
              Clear canvas
            </button>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="muted">Leave-one-out accuracy</span>
              <b>{accuracy}%</b>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                className="h-full rounded-full bg-gradient-to-r from-rose-400 to-cyan-400"
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {training
                ? 'The model is colouring the plane, region by region…'
                : painted >= 40
                  ? 'Decision regions drawn! Click anywhere on the map to test a new point.'
                  : 'Press Train to colour the plane and reveal the model\u2019s decision regions.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Perceptron() {
  const [w, setW] = useState([0, 0])
  const [b, setB] = useState(0)
  const [epochs, setEpochs] = useState(0)
  const [running, setRunning] = useState(false)
  const [pred, setPred] = useState<{ x: number; y: number } | null>(null)
  const wRef = useRef([0, 0])
  const bRef = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const LR = 0.6

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
    },
    [],
  )

  function train() {
    setRunning(true)
    setPred(null)
    setEpochs(0)
    wRef.current = [0, 0]
    bRef.current = 0
    setW([0, 0])
    setB(0)
    if (timer.current) clearInterval(timer.current)
    let e = 0
    timer.current = window.setInterval(() => {
      const { weights, bias } = trainPerceptron(andPoints, LR, 1, {
        weights: [wRef.current[0], wRef.current[1]],
        bias: bRef.current,
      })
      wRef.current = weights
      bRef.current = bias
      setW(weights)
      setB(bias)
      e += 1
      setEpochs(e)
      if (e >= 30) {
        if (timer.current) clearInterval(timer.current)
        setRunning(false)
      }
    }, 70)
  }
  function reset() {
    if (timer.current) clearInterval(timer.current)
    setW([0, 0])
    setB(0)
    setEpochs(0)
    setRunning(false)
    setPred(null)
    wRef.current = [0, 0]
    bRef.current = 0
  }
  const accuracy = useMemo(
    () =>
      andPoints.filter((p) => perceptronClassify(w[0], w[1], b, p.x, p.y) === p.label).length * 25,
    [w, b],
  )
  const px = (x: number) => 5 + (x + 0.4) * 50
  const py = (y: number) => 95 - (y + 0.4) * 50
  const line = useMemo(() => {
    if (!epochs) return null
    const [w1, w2] = w
    if (w1 === 0 && w2 === 0) return null
    const clamp = (v: number) => Math.max(-0.3, Math.min(1.3, v))
    if (Math.abs(w2) > 1e-9)
      return {
        a: { x: -0.2, y: clamp(-(w1 * -0.2 + b) / w2) },
        b: { x: 1.2, y: clamp(-(w1 * 1.2 + b) / w2) },
      }
    return { a: { x: -b / w1, y: -0.3 }, b: { x: -b / w1, y: 1.3 } }
  }, [w, b, epochs])
  function click(e: MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setPred({
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (r.bottom - e.clientY) / r.height)),
    })
  }
  const predClass = pred ? perceptronClassify(w[0], w[1], b, pred.x, pred.y) : null

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">The AND-gate neuron</p>
            <p className="mt-1 text-xs text-slate-400">
              Watch the decision line sweep as one tiny neuron learns to separate two classes.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={train}
              disabled={running}
              className="btn-primary flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {running ? <LoaderCircle size={13} className="animate-spin" /> : <Play size={13} />}
              {running ? 'Learning…' : 'Train neuron'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:bg-white/10"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        </div>
        <div className="relative mt-4">
          <svg
            viewBox="0 0 100 100"
            onClick={click}
            className="w-full cursor-crosshair rounded-xl border border-white/10 bg-black/30"
            role="img"
            aria-label="Perceptron training plot. The violet line is the learned decision boundary."
          >
            {Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map((v) => (
              <g key={v}>
                <line x1={v} y1={0} x2={v} y2={100} stroke="rgba(255,255,255,.05)" />
                <line x1={0} y1={v} x2={100} y2={v} stroke="rgba(255,255,255,.05)" />
              </g>
            ))}
            <line
              x1={px(0)}
              y1={2}
              x2={px(0)}
              y2={98}
              stroke="rgba(148,163,184,.35)"
              strokeWidth={1}
            />
            <line
              x1={2}
              y1={py(0)}
              x2={98}
              y2={py(0)}
              stroke="rgba(148,163,184,.35)"
              strokeWidth={1}
            />
            <text x={px(0) - 2} y={py(0) + 3} fill="#64748b" fontSize="5" textAnchor="end">
              0
            </text>
            <text x={38} y={99} fill="#64748b" fontSize="6">
              input 1 →
            </text>
            <text x={2} y={8} fill="#64748b" fontSize="6">
              input 2 ↑
            </text>
            {andPoints.map((p, i) => (
              <g key={i}>
                <circle
                  cx={px(p.x)}
                  cy={py(p.y)}
                  r={4}
                  fill={p.label ? '#34d399' : '#94a3b8'}
                  stroke="#0b1220"
                  strokeWidth={1.4}
                />
                <text
                  x={px(p.x) + 6}
                  y={py(p.y) + 2}
                  fill={p.label ? '#34d399' : '#94a3b8'}
                  fontSize="5.5"
                >{`(${p.x},${p.y})`}</text>
              </g>
            ))}
            {line && (
              <line
                x1={px(line.a.x)}
                y1={py(line.a.y)}
                x2={px(line.b.x)}
                y2={py(line.b.y)}
                stroke="#a78bfa"
                strokeWidth={2.4}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 4px rgba(167,139,250,.8))' }}
              />
            )}
            {pred && (
              <g>
                <circle
                  cx={px(pred.x)}
                  cy={py(pred.y)}
                  r={6}
                  fill="none"
                  stroke={predClass ? '#34d399' : '#fda4af'}
                  strokeWidth={2.4}
                />
                <circle
                  cx={px(pred.x)}
                  cy={py(pred.y)}
                  r={2}
                  fill={predClass ? '#34d399' : '#fda4af'}
                />
              </g>
            )}
          </svg>
          <span className="pointer-events-none absolute right-3 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-slate-400">
            {epochs ? 'click to test a point' : 'train, then click to test'}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              class 0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              class 1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-6 rounded bg-violet-400" />
              decision line
            </span>
          </span>
          <span>epoch {epochs}/30</span>
        </div>
      </div>
      <div className="space-y-5">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold">Inside the neuron</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Each input is multiplied by a weight and summed with a bias. If the total crosses 0, the
            neuron fires class 1.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="muted">Weights</span>
              <b>
                [{w[0].toFixed(2)}, {w[1].toFixed(2)}]
              </b>
            </div>
            <div className="flex justify-between">
              <span className="muted">Bias</span>
              <b>{b.toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span className="muted">Accuracy</span>
              <b>{accuracy}%</b>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
            />
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold">Your prediction</p>
          {pred ? (
            <div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-300/10 p-4">
              <p className="text-xs text-violet-200">
                Score = {w[0].toFixed(2)}×{pred.x.toFixed(2)} + {w[1].toFixed(2)}×
                {pred.y.toFixed(2)} + {b.toFixed(2)} ={' '}
                <b>{(w[0] * pred.x + w[1] * pred.y + b).toFixed(2)}</b>
              </p>
              <p className="mt-1 text-xl font-bold">Class: {predClass}</p>
              <p className="mt-1 text-xs text-slate-400">
                Score above 0 → class 1, otherwise class 0. Train the neuron for a meaningful
                boundary.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              Click anywhere on the plot after training to run the neuron on that input.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Regression() {
  const [m, setM] = useState(0),
    [b, setB] = useState(0),
    [epochs, setEpochs] = useState(0),
    [value, setValue] = useState(7)
  function train() {
    const { slope, intercept } = trainLinearRegression(regression)
    setM(slope)
    setB(intercept)
    setEpochs(500)
  }
  const prediction = m * value + b
  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Fit a line to data</p>
            <p className="mt-1 text-xs text-slate-400">
              Regression finds the line that minimises the distance between predictions and real
              values.
            </p>
          </div>
          <button
            onClick={train}
            className="btn-primary flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
          >
            <Sigma size={13} />
            Train regression
          </button>
        </div>
        <svg
          viewBox="0 0 320 210"
          className="mt-4 w-full"
          role="img"
          aria-label="Regression data and fitted line"
        >
          <path d="M35 15V180H305" stroke="currentColor" opacity=".35" fill="none" />
          {regression.map((p, i) => (
            <circle key={i} cx={35 + p.x * 40} cy={180 - p.y * 11} r="5" fill="#67e8f9" />
          ))}
          {epochs > 0 && (
            <line
              x1="35"
              y1={180 - (m * 0 + b) * 11}
              x2="305"
              y2={180 - (m * 6.75 + b) * 11}
              stroke="#a78bfa"
              strokeWidth="3"
            />
          )}
          <text x="150" y="205" fill="currentColor" fontSize="11">
            Input x
          </text>
          <text x="4" y="20" fill="currentColor" fontSize="11">
            y
          </text>
        </svg>
      </div>
      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold">Make a prediction</p>
        <label className="mt-5 block text-xs text-slate-400">
          New x value: <b>{value}</b>
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="mt-2 w-full accent-cyan-400"
          />
        </label>
        <div className="mt-6 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-xs text-cyan-100">
            Model: y = {m.toFixed(2)}x + {b.toFixed(2)}
          </p>
          <p className="mt-1 text-xl font-bold">Predicted y: {prediction.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {epochs
              ? `${epochs} gradient-descent steps completed.`
              : 'Train the model to fit the plotted points.'}
          </p>
        </div>
        <button
          onClick={() => {
            setM(0)
            setB(0)
            setEpochs(0)
          }}
          className="mt-4 flex items-center gap-2 text-xs text-slate-400 hover:text-white"
        >
          <RotateCcw size={14} />
          Reset model
        </button>
      </div>
    </div>
  )
}

function chip(active: boolean, color: 'rose' | 'cyan' | 'slate') {
  const map = {
    rose: 'border-rose-400/30 bg-rose-400/15 text-rose-200',
    cyan: 'border-cyan-400/30 bg-cyan-400/15 text-cyan-200',
    slate: 'border-white/15 bg-white/10 text-slate-200',
  }
  return `flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${active ? map[color] : 'border-white/10 text-slate-400 hover:bg-white/5'}`
}

function Concept({ title, accent, body }: { title: string; accent: string; body: string }) {
  return (
    <div className="glass glass-hover rounded-2xl p-5">
      <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${accent}`} />
      <h3 className="font-display mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  )
}
