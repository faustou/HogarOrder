import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useObjects } from '../../hooks/useObjects'
import { usePoints } from '../../hooks/usePoints'
import { canResolve, uploadsNeededToResolve } from '../../lib/rules'
import SwipeCard from '../../components/SwipeCard'
import type { DecisionOption, UserProfile } from '../../types'

const cardVariants = {
  enter:  { opacity: 0, y: 48, scale: 0.93 },
  center: { opacity: 1, y: 0,  scale: 1    },
  exitUp:   { opacity: 0, y: -90, rotate: -12, scale: 0.82 },
  exitDown: { opacity: 0, y:  90, rotate:  12, scale: 0.82 },
}

interface SwipeProps {
  profile: UserProfile
  onRefreshScores: () => void
}

export default function Swipe({ profile, onRefreshScores }: SwipeProps) {
  const { current, loading, empty, resolving, resolve } = useObjects(profile.id)
  const { stats, refetch: refetchPoints } = usePoints(profile.id)
  const [uploaderName, setUploaderName] = useState('')
  const [exitVariant, setExitVariant] = useState<'exitUp' | 'exitDown'>('exitUp')

  const canAct = canResolve(stats.uploads, stats.resolutions)
  const needed = uploadsNeededToResolve(stats.uploads, stats.resolutions)

  useEffect(() => {
    if (!current) return
    supabase
      .from('users').select('name')
      .eq('id', current.uploaded_by).single()
      .then(({ data }) => setUploaderName(data?.name ?? ''))
  }, [current?.id])

  async function handleResolve(action: DecisionOption, explanation?: string) {
    const POSITIVE: DecisionOption[] = ['tirar', 'donar', 'reubicar']
    setExitVariant(POSITIVE.includes(action) ? 'exitUp' : 'exitDown')
    await resolve(action, explanation)
    refetchPoints()
    onRefreshScores()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}>
          <span className="text-4xl">🃏</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0A0A0F' }}>

      {/* Mini header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#3F3F46' }}>
          Cola de objetos
        </p>
        {!canAct && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <span>⛔</span> Cargá {needed} más
          </div>
        )}
        {canAct && current && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            ✓ Podés resolver
          </div>
        )}
      </div>

      {/* Cola vacía */}
      {empty && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <span className="text-7xl">🎉</span>
          </motion.div>
          <h2 className="font-display text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: '#F4F4F5' }}>
            Cola vacía
          </h2>
          <p className="text-sm" style={{ color: '#52525B' }}>
            No hay objetos pendientes. Cargá uno nuevo para seguir sumando puntos.
          </p>
        </div>
      )}

      {/* Bloqueado */}
      {!empty && current && !canAct && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <span className="text-7xl">⛔</span>
          </motion.div>
          <h2 className="font-display text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: '#F4F4F5' }}>
            Necesitás cargar más
          </h2>
          <p className="text-sm" style={{ color: '#52525B' }}>
            Tenés que cargar{' '}
            <span style={{ color: '#7C3AED', fontWeight: 600 }}>{needed} objeto{needed !== 1 ? 's' : ''} más</span>
            {' '}antes de poder resolver.
          </p>
          <div
            className="rounded-xl px-4 py-3 text-xs"
            style={{ background: '#111118', border: '1px solid #1E1E2E', color: '#52525B' }}
          >
            Cargas: {stats.uploads} · Resoluciones: {stats.resolutions}
          </div>
        </div>
      )}

      {/* SwipeCard con AnimatePresence */}
      {!empty && current && canAct && (
        <AnimatePresence mode="wait" custom={exitVariant}>
          <motion.div
            key={current.id}
            className="flex-1 flex flex-col min-h-0"
            custom={exitVariant}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit={exitVariant}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <SwipeCard
              object={current}
              uploaderName={uploaderName}
              onResolve={handleResolve}
              resolving={resolving}
            />
          </motion.div>
        </AnimatePresence>
      )}

    </div>
  )
}
