import { useState } from 'react'
import { motion } from 'framer-motion'
import type { DecisionOption, HogarObject } from '../../types'

interface ActionConfig {
  option: DecisionOption
  label: string
  points: string
  color: string
  bg: string
}

const ACTIONS: ActionConfig[] = [
  { option: 'donar',     label: 'Donar',    points: '+15', color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  { option: 'tirar',     label: 'Tirar',    points: '+10', color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  { option: 'reubicar',  label: 'Reubicar', points: '+7',  color: '#06B6D4', bg: 'rgba(6,182,212,0.12)'   },
  { option: 'dejar_con', label: 'Dejar*',   points: '0',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  { option: 'posponer',  label: 'Posponer', points: '-5',  color: '#71717A', bg: 'rgba(113,113,122,0.10)' },
  { option: 'dejar_sin', label: 'Dejar',    points: '-10', color: '#EF4444', bg: 'rgba(239,68,68,0.07)'   },
]

const ZONE_EMOJI: Record<string, string> = {
  living: '🛋️', cocina: '🍳', baño: '🚿',
  dormitorio: '🛏️', patio: '🌿', otro: '📦',
}

interface SwipeCardProps {
  object: HogarObject
  uploaderName: string
  onResolve: (action: DecisionOption, explanation?: string) => void
  resolving: boolean
}

export default function SwipeCard({ object, uploaderName, onResolve, resolving }: SwipeCardProps) {
  const [pendingAction, setPendingAction] = useState<DecisionOption | null>(null)
  const [explanation, setExplanation] = useState('')

  function handleAction(option: DecisionOption) {
    if (resolving) return
    if (option === 'dejar_con') { setPendingAction('dejar_con'); return }
    onResolve(option)
  }

  function confirmDejarCon() {
    if (!explanation.trim()) return
    onResolve('dejar_con', explanation.trim())
    setExplanation('')
    setPendingAction(null)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="flex flex-col gap-3 min-h-full justify-between">

      {/* Card del objeto */}
      <div
        className="flex flex-col rounded-2xl overflow-hidden glow-accent"
        style={{ background: '#111118', border: '1px solid #1E1E2E' }}
      >
        {/* Foto */}
        <div className="relative overflow-hidden" style={{ background: '#0A0A0F', height: '38vh', minHeight: '160px', maxHeight: '260px' }}>
          {object.image_url ? (
            <img src={object.image_url} alt={object.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl opacity-10">📦</span>
            </div>
          )}
          {/* Gradient overlay bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-24"
            style={{ background: 'linear-gradient(to top, #111118, transparent)' }}
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#F4F4F5', backdropFilter: 'blur(8px)' }}
            >
              {ZONE_EMOJI[object.zone] ?? '📦'} {object.zone}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#A1A1AA', backdropFilter: 'blur(8px)' }}
            >
              por {uploaderName}
            </span>
          </div>
        </div>

        {/* Nombre */}
        <div className="px-4 py-3">
          <h2
            className="font-display text-xl font-bold leading-tight"
            style={{ color: '#F4F4F5', fontFamily: "'Syne', sans-serif" }}
          >
            {object.name}
          </h2>
        </div>
      </div>

      {/* Bottom sheet dejar_con — fixed, fuera del flujo */}
      {pendingAction === 'dejar_con' && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setPendingAction(null)}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative flex flex-col gap-4 px-4 pt-5 pb-8 rounded-t-3xl"
            style={{ background: '#111118', border: '1px solid #1E1E2E' }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: '#2E2E3E' }} />
            <p
              className="font-display text-base font-bold"
              style={{ fontFamily: "'Syne', sans-serif", color: '#F4F4F5' }}
            >
              ¿Por qué lo dejás?
            </p>
            <textarea
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Justificá el motivo..."
              rows={3}
              autoFocus
              className="rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: '#0A0A0F', border: '1px solid #1E1E2E', color: '#F4F4F5' }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E2E'; e.target.style.boxShadow = 'none' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setPendingAction(null); setExplanation('') }}
                className="flex-1 rounded-xl py-3.5 text-sm font-medium"
                style={{ background: '#1E1E2E', color: '#71717A' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDejarCon}
                disabled={!explanation.trim()}
                className="flex-1 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-40"
                style={{ background: '#F59E0B', color: '#0A0A0F' }}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Botones de acción */}
      {!pendingAction && (
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map(({ option, label, points, color, bg }) => (
            <motion.button
              key={option}
              onClick={() => handleAction(option)}
              disabled={resolving}
              whileTap={{ scale: 0.93 }}
              className="rounded-xl py-3 flex flex-col items-center gap-1 disabled:opacity-40"
              style={{ background: bg, border: `1px solid ${color}22` }}
            >
              <span className="text-xs font-semibold" style={{ color }}>
                {label}
              </span>
              <span className="text-xs font-medium" style={{ color, opacity: 0.7 }}>
                {points} pts
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <p className="text-center text-xs pt-1" style={{ color: '#3F3F46' }}>
        * Dejar con justificación
      </p>

      </div>
    </div>
  )
}
