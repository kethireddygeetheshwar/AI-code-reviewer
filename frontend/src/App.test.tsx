import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

vi.mock('./lib/supabase', () => ({ supabase: null, authConfigured: false }))
vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })))

test('guests can continue and see the product title', () => {
  render(<App />)
  fireEvent.click(screen.getByText('Continue without account'))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/AI-powered code review/i)
})
