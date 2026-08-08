import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Editor from '@monaco-editor/react'
import {
  AlertTriangle,
  BrainCircuit,
  Check,
  FileSpreadsheet,
  Gauge,
  LoaderCircle,
  Play,
  Sparkles,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { mlAnalysis } from '../lib/api'
import type { MLAnalysis as MLAnalysisResult } from '../lib/api'

const SAMPLE_CSV = `id,tenure,monthly_charges,calls,churn
1,12,49.9,120,0
2,24,59.9,98,0
3,3,79.9,45,1
4,36,69.9,110,0
5,1,89.9,30,1
6,48,,132,0
7,6,74.9,52,1
8,60,45.0,140,0
9,9,84.9,61,1
10,30,64.9,99,0
11,2,92.5,28,1
12,18,52.5,115,0
13,5,71.9,58,1
14,42,58.9,121,0
15,15,88.0,64,0
16,54,48.9,138,0
17,33,61.9,105,0
18,4,81.9,41,0
19,27,66.9,96,0
20,11,72.9,60,0
21,39,57.5,124,0
22,8,75.9,54,0
23,21,63.9,101,0
24,17,68.9,88,0
25,45,51.9,129,0
26,14,80.5,66,0
27,1,89.9,30,1`

const SAMPLE_CODE = `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score, classification_report

df = pd.read_csv('churn.csv')
X = df.drop('churn', axis=1)
y = df['churn']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y
)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
preds = model.predict(X_test)
print(f1_score(y_test, preds))
print(classification_report(y_test, preds))`

const barColor = (s: string) =>
  s === 'ok'
    ? 'from-emerald-500 to-cyan-400'
    : s === 'warn'
      ? 'from-amber-500 to-orange-400'
      : 'from-rose-500 to-red-400'
const textColor = (s: string) =>
  s === 'ok' ? 'text-emerald-300' : s === 'warn' ? 'text-amber-300' : 'text-rose-300'
const StatusIcon = ({ s }: { s: string }) =>
  s === 'ok' ? (
    <Check size={16} className="text-emerald-300" />
  ) : s === 'warn' ? (
    <AlertTriangle size={16} className="text-amber-300" />
  ) : (
    <XCircle size={16} className="text-rose-300" />
  )

export function MLAnalyzer() {
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [code, setCode] = useState(SAMPLE_CODE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<MLAnalysisResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function onFile(file: File) {
    if (!/\.csv$/i.test(file.name)) {
      setError('Please upload a .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''))
      setFileName(file.name)
      setError('')
    }
    reader.readAsText(file)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }

  async function run() {
    if (!csvText || loading) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await mlAnalysis(csvText, code))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ML analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="ml-analyzer" className="mt-8">
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-violet-200">
          <Gauge size={18} />
          ML Health Analyzer
        </p>
        <h2 className="font-display mt-1 text-2xl font-bold">Upload a dataset + your code → get an ML health score.</h2>
        <p className="mt-1 text-sm text-slate-400">
          Checks data quality, leakage risk, validation, metrics, model choice, and class balance.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass space-y-4 rounded-2xl p-5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition ${
              dragOver ? 'border-violet-400 bg-violet-400/10' : 'border-white/15 bg-white/5 hover:border-violet-400/50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            {csvText ? (
              <span className="flex items-center gap-2 text-sm">
                <FileSpreadsheet size={18} className="text-emerald-300" />
                <b>{fileName}</b>
                <span className="muted">— {csvText.split('\n').filter((l) => l.trim()).length - 1} rows</span>
              </span>
            ) : (
              <>
                <UploadCloud size={26} className="mb-2 text-violet-300" />
                <p className="text-sm">Drop your CSV here, or <span className="text-violet-200 underline">browse</span></p>
                <p className="muted mt-1 text-xs">Header row required · one target column</p>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setCsvText(SAMPLE_CSV)
                setFileName('churn.csv')
                setError('')
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              <Sparkles size={14} className="text-violet-300" />
              Try the sample dataset
            </button>
            <span className="muted text-xs">Analyzes in your browser — nothing uploaded</span>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="ml-code">Training code</label>
              <button
                onClick={() => setCode(SAMPLE_CODE)}
                className="muted text-xs underline hover:text-white"
              >
                Use sample code
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <Editor
                height="260px"
                language="python"
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>

          <button
            onClick={run}
            disabled={!csvText || loading}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Play size={18} />}
            {loading ? 'Analyzing…' : 'Run ML analysis'}
          </button>
          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-rose-400/10 px-3 py-2 text-sm text-rose-300">
              <AlertTriangle size={14} /> {error}
            </p>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-slate-400"
              >
                <LoaderCircle size={28} className="animate-spin text-violet-300" />
                <p className="text-sm">Computing your ML health score…</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-5">
                  <div
                    className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${result.score >= 80 ? '#34d399' : result.score >= 60 ? '#fbbf24' : '#fb7185'} ${result.score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                    }}
                  >
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-ink">
                      <span className="font-display text-3xl font-bold">{result.score}</span>
                      <span className="muted text-[10px] uppercase tracking-wider">Health</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold">
                      ML Health Score: <span className={textColor(result.status)}>{result.score}/100</span>
                    </h3>
                    <p className="muted mt-1 text-xs leading-5">
                      {result.dataset.rows} rows · {result.dataset.columns} columns · target:{' '}
                      <b className="text-slate-300">{result.dataset.target}</b> ({result.dataset.target_type})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded bg-white/5 px-2 py-0.5">missing {result.dataset.missing_pct}%</span>
                      <span className="rounded bg-white/5 px-2 py-0.5">duplicates {result.dataset.duplicate_pct}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.categories.map((c) => (
                    <div key={c.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <StatusIcon s={c.status} />
                          {c.label}
                        </span>
                        <span className="font-semibold">{c.score}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${c.score}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${barColor(c.status)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <BrainCircuit size={15} className="text-violet-300" />
                    Findings
                  </h4>
                  {result.issues.length ? (
                    <ul className="space-y-2">
                      {result.issues.map((i, idx) => (
                        <li
                          key={idx}
                          className="flex gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300"
                        >
                          <StatusIcon s={i.severity === 'high' ? 'bad' : i.severity === 'medium' ? 'warn' : 'ok'} />
                          <span>
                            <b className={textColor(i.severity === 'high' ? 'bad' : i.severity === 'medium' ? 'warn' : 'ok')}>
                              {i.category}:
                            </b>{' '}
                            {i.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-emerald-300">No issues detected — this looks healthy.</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-center text-slate-400">
                <Gauge size={30} className="text-slate-600" />
                <p className="max-w-xs text-sm">
                  Your <b className="text-slate-300">ML Health Score</b> will appear here once you run an analysis.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
