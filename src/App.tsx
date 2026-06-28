import { useState } from 'react'
import { useUser } from './hooks/useUser'
import { useWeeklyScores } from './hooks/useWeeklyScores'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import Swipe from './pages/Swipe'
import Upload from './pages/Upload'
import History from './pages/History'
import BottomNav, { type Page } from './components/BottomNav'
import type { UserProfile } from './types'

export default function App() {
  const { user, profile, loading } = useUser()
  const [page, setPage] = useState<Page>('home')

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <span className="text-4xl opacity-60">🏠</span>
      </div>
    )
  }

  if (!user || !profile) return <Login />

  return <AppShell profile={profile} page={page} setPage={setPage} />
}

function AppShell({ profile, page, setPage }: {
  profile: UserProfile
  page: Page
  setPage: (p: Page) => void
}) {
  const { refetch: refetchScores } = useWeeklyScores()

  return (
    <div className="h-dvh flex flex-col" style={{ background: '#0A0A0F' }}>

      {/* Micro header */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid #1E1E2E', background: '#0A0A0F' }}
      >
        <span
          className="font-display text-base font-bold"
          style={{ fontFamily: "'Syne', sans-serif", color: '#F4F4F5' }}
        >
          HogarOrder
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs px-3 py-1 rounded-lg transition-colors"
          style={{ color: '#52525B', background: '#111118', border: '1px solid #1E1E2E' }}
        >
          Salir
        </button>
      </header>

      {/* Página */}
      <div className="flex-1 flex flex-col min-h-0">
        {page === 'home' && (
          <Home profile={profile} onNavigateSwipe={() => setPage('swipe')} />
        )}
        {page === 'swipe' && (
          <Swipe profile={profile} onRefreshScores={refetchScores} />
        )}
        {page === 'upload' && (
          <Upload
            profile={profile}
            onSuccess={() => { refetchScores(); setPage('home') }}
          />
        )}
        {page === 'history' && <History profile={profile} />}
      </div>

      <BottomNav current={page} onChange={setPage} />
    </div>
  )
}
