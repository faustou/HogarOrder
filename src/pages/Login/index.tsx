import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: '#0A0A0F' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Logo / titulo */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <span className="text-3xl">🏠</span>
          </div>
          <h1
            className="font-display text-3xl tracking-tight"
            style={{ color: '#F4F4F5', fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
          >
            HogarOrder
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#52525B' }}>
            El orden de casa, en serio
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl p-6"
          style={{ background: '#111118', border: '1px solid #1E1E2E' }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: '#52525B' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: '#0A0A0F',
                border: '1px solid #1E1E2E',
                color: '#F4F4F5',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E2E'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: '#52525B' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: '#0A0A0F',
                border: '1px solid #1E1E2E',
                color: '#F4F4F5',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E2E'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {error && (
            <p
              className="text-sm text-center rounded-xl py-2.5 px-3"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-xl py-3.5 text-sm font-semibold transition-opacity disabled:opacity-50 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
              color: '#fff',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
