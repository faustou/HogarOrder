import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useWeeklyScores } from '../../hooks/useWeeklyScores'
import { usePoints } from '../../hooks/usePoints'
import { uploadsNeededToResolve } from '../../lib/rules'
import { getMondayOfCurrentWeek } from '../../lib/rules'
import type { UserProfile } from '../../types'

interface RecentTx {
  id: string
  points: number
  reason: string
  created_at: string
}

const REASON_LABEL: Record<string, string> = {
  upload: 'Cargaste un objeto',
  tirar: 'Tirar',
  donar: 'Donar',
  reubicar: 'Reubicar',
  dejar_con: 'Dejar (justificado)',
  posponer: 'Posponer',
  dejar_sin: 'Dejar sin justificar',
}

const REASON_ICON: Record<string, string> = {
  upload: '📦', tirar: '🗑️', donar: '💚',
  reubicar: '🔄', dejar_con: '📝', posponer: '⏸️', dejar_sin: '❌',
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    if (target === prevTarget.current) return
    prevTarget.current = target
    const start = Date.now()
    const from = value
    const diff = target - from
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return value
}

interface ScoreCardProps {
  user: { id: string; name: string; weeklyPoints: number; totalPoints: number }
  isCurrentUser: boolean
  isWinning: boolean
}

function ScoreCard({ user, isCurrentUser, isWinning }: ScoreCardProps) {
  const animatedPts = useCountUp(user.weeklyPoints)
  const pointColor = isWinning ? '#10B981' : user.weeklyPoints < 0 ? '#EF4444' : '#71717A'

  return (
    <div
      className={`flex-1 rounded-2xl p-4 flex flex-col gap-2 ${isCurrentUser ? 'gradient-border' : 'glass'}`}
      style={!isCurrentUser ? { background: '#111118' } : undefined}
    >
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#52525B' }}>
        {isCurrentUser ? 'Vos' : 'Rival'}
      </p>
      <p className="font-display text-base font-bold" style={{ color: '#F4F4F5', fontFamily: "'Syne', sans-serif" }}>
        {user.name}
      </p>
      <p
        className="font-display text-4xl font-bold leading-none mt-1"
        style={{ color: pointColor, fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
      >
        {animatedPts}
      </p>
      <p className="text-xs" style={{ color: '#52525B' }}>pts esta semana</p>
      <div className="mt-1 pt-2" style={{ borderTop: '1px solid #1E1E2E' }}>
        <p className="text-xs" style={{ color: '#3F3F46' }}>
          Total: <span style={{ color: '#52525B' }}>{user.totalPoints}</span>
        </p>
      </div>
    </div>
  )
}

interface HomeProps {
  profile: UserProfile
  onNavigateSwipe: () => void
}

export default function Home({ profile, onNavigateSwipe }: HomeProps) {
  const { users, weeklyObjective, totalWeeklyPoints, loading } = useWeeklyScores()
  const { stats } = usePoints(profile.id)
  const [recentTx, setRecentTx] = useState<RecentTx[]>([])
  const needed = uploadsNeededToResolve(stats.uploads, stats.resolutions)
  const canResolveNow = needed === 0

  useEffect(() => {
    supabase
      .from('point_transactions')
      .select('id, points, reason, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setRecentTx((data ?? []) as RecentTx[]))
  }, [profile.id])

  const progressPct = Math.min((totalWeeklyPoints / weeklyObjective) * 100, 100)
  const currentUser = users.find(u => u.id === profile.id)
  const otherUser = users.find(u => u.id !== profile.id)
  const isWinning = (currentUser?.weeklyPoints ?? 0) >= (otherUser?.weeklyPoints ?? 0)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-5 px-4 py-5 max-w-md mx-auto">

        {/* Saludo */}
        <div>
          <p className="text-sm" style={{ color: '#52525B' }}>
            {new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 20 ? 'Buenas tardes' : 'Buenas noches'}
          </p>
          <h1
            className="font-display text-3xl tracking-tight leading-tight"
            style={{ color: '#F4F4F5', fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
          >
            {profile.name} 👋
          </h1>
        </div>

        {/* Score cards */}
        {!loading && currentUser && otherUser && (
          <div className="flex gap-3">
            <ScoreCard user={currentUser} isCurrentUser isWinning={isWinning} />
            <ScoreCard user={otherUser} isCurrentUser={false} isWinning={!isWinning} />
          </div>
        )}

        {/* Objetivo semanal */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: '#111118', border: '1px solid #1E1E2E' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: '#A1A1AA' }}>Objetivo semanal</p>
            <p className="text-sm font-semibold" style={{ color: '#F4F4F5' }}>
              {totalWeeklyPoints} / {weeklyObjective} pts
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1E1E2E' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs" style={{ color: '#52525B' }}>
            {progressPct >= 100
              ? '🎉 ¡Objetivo cumplido! Ambos pagan $10.000 para la casa'
              : `Faltan ${weeklyObjective - totalWeeklyPoints} pts para el objetivo conjunto`}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#3F3F46' }}>
            Si se llega al objetivo → <span style={{ color: '#10B981' }}>$10.000 c/u</span> para la casa.
            Si no → el que menos puntos haga paga <span style={{ color: '#EF4444' }}>$20.000</span>.
          </p>
        </div>

        {/* Estado de cargas */}
        <button
          onClick={onNavigateSwipe}
          className="rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
          style={{ background: '#111118', border: `1px solid ${canResolveNow ? 'rgba(124,58,237,0.4)' : '#1E1E2E'}` }}
        >
          <div className="flex flex-col gap-0.5 text-left">
            <p className="text-sm font-medium" style={{ color: '#F4F4F5' }}>
              {canResolveNow ? '¡Podés resolver!' : `Cargá ${needed} objeto${needed !== 1 ? 's' : ''} más`}
            </p>
            <p className="text-xs" style={{ color: '#52525B' }}>
              {stats.uploads} cargas · {stats.resolutions} resoluciones
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: canResolveNow ? 'rgba(124,58,237,0.2)' : 'rgba(239,68,68,0.1)',
              color: canResolveNow ? '#7C3AED' : '#EF4444',
            }}
          >
            {canResolveNow ? '→' : needed}
          </div>
        </button>

        {/* Actividad reciente */}
        {recentTx.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-widest px-1" style={{ color: '#52525B' }}>
              Actividad reciente
            </p>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#111118', border: '1px solid #1E1E2E' }}
            >
              {recentTx.map((tx, i) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid #1E1E2E' : 'none' }}
                >
                  <span className="text-lg">{REASON_ICON[tx.reason] ?? '📦'}</span>
                  <p className="flex-1 text-sm" style={{ color: '#A1A1AA' }}>
                    {REASON_LABEL[tx.reason] ?? tx.reason}
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: tx.points > 0 ? '#10B981' : tx.points < 0 ? '#EF4444' : '#71717A' }}
                  >
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
