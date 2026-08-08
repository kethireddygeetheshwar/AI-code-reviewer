const API = import.meta.env.VITE_API_URL || '/api'
const TOKEN = import.meta.env.VITE_API_TOKEN || ''

function authHeaders(json = false): Record<string, string> {
  const headers: Record<string, string> = {}
  if (json) headers['Content-Type'] = 'application/json'
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`
  return headers
}

export type Review = {
  summary: string
  score: number
  metrics: Record<string, number>
  bugs: { severity: string; title: string; explanation: string; line: number }[]
  optimizations: string[]
  explanation: { purpose: string; functions: string[]; logic: string[] }
  security: string[]
  complexity: { time: string; space: string; explanation: string }
  improved_code: string
  improvements: string[]
  provider_notice?: string
}
export async function reviewCode(
  code: string,
  language: string,
  title: string,
  focus: string = 'balanced',
) {
  const r = await fetch(`${API}/reviews`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ code, language, title, focus }),
  })
  if (!r.ok) throw new Error('Review service is unavailable.')
  return r.json() as Promise<{ id: number; review: Review }>
}
export async function history() {
  const r = await fetch(`${API}/reviews`, { headers: authHeaders() })
  if (!r.ok) throw new Error('Could not load history.')
  return r.json()
}
export async function getReview(id: number) {
  const r = await fetch(`${API}/reviews/${id}`, { headers: authHeaders() })
  if (!r.ok) throw new Error('Could not open review.')
  return r.json()
}
export async function ask(
  question: string,
  code: string,
  language: string,
  review_context: Review | null,
) {
  const r = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ question, code, language, review_context }),
  })
  if (!r.ok) throw new Error('Chat is unavailable.')
  return r.json()
}
export async function generateTests(code: string, language: string) {
  const r = await fetch(`${API}/generate-tests`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ code, language }),
  })
  if (!r.ok) throw new Error('Test generation is unavailable.')
  return r.json() as Promise<{ tests: string }>
}
export const reportUrl = (id: number) =>
  `${API}/reviews/${id}/report${TOKEN ? `?token=${TOKEN}` : ''}`
