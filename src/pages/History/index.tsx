import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useHistory } from '../../hooks/useHistory'
import { useWeeklyScores } from '../../hooks/useWeeklyScores'
import type { UserProfile } from '../../types'

type Tab = 'semanas' | 'conservados'

interface KeptObject {
  decision_id: string
  object_name: string
  object_zone: string
  object_image: string | null
  action: 'dejar_con' | 'dejar_sin'
  explanation: string | null
  decided_by_name: string
  decided_at: string
}

const ZONE_EMOJI: Record<string, string> = {
  living: '🛋️', cocina: '🍳', baño: '🚿',
  dormitorio: '🛏️', patio: '🌿', otro: '📦',
}

function formatWeekRange(weekStart: string): string {
  const monday = new Date(weekStart + 'T12:00:00')
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  return `${fmt(monday)} — ${fmt(sunday)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface HistoryProps {
  profile: UserProfile
}

export default function History({ profile }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<Tab>('semanas')
  const { history, loading } = useHistory()
  const { users, weeklyObjective, totalWeeklyPoints } = useWeeklyScores()
  const [keptObjects, setKeptObjects] = useState<KeptObject[]>([])
  const [keptLoading, setKeptLoading] = useState(false)

  const currentUser = users.find(u => u.id === profile.id)
  const otherUser = users.find(u => u.id !== profile.id)
  const currentWeekObjectiveReached = totalWeeklyPoints >= weeklyObjective
  const currentLoser = !currentWeekObjectiveReached && currentUser && otherUser
    ? currentUser.weeklyPoints <= otherUser.weeklyPoints ? currentUser : otherUser
    : null

  useEffect(() => {
    if (activeTab !== 'conservados') return
    setKeptLoading(true)
    supabase
      .from('decisions')
      .select(`
        id,
        action,
        explanation,
        decided_at,
        objects ( name, zone, image_url ),
        users ( name )
      `)
      .in('action', ['dejar_con', 'dejar_sin'])
      .order('decided_at', { ascending: false })
      .then(({ data }) => {
        const items = (data ?? []).map((d: any) => ({
          decision_id: d.id,
          object_name: d.objects?.name ?? '',
          object_zone: d.objects?.zone ?? '',
          object_image: d.objects?.image_url ?? null,
          action: d.action,
          explanation: d.explanation,
          decided_by_name: d.users?.name ?? '',
          decided_at: d.decided_at,
        }))
        setKeptObjects(items)
        setKeptLoading(false)
      })
  }, [activeTab])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header + tabs internos */}
      <div className="shrink-0 px-4 pt-5 pb-0 max-w-md mx-auto w-full">
        <h2
          className="font-display text-2xl font-bold mb-4"
          style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#F4F4F5' }}
        >
          Historial
        </h2>
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: '#111118', border: '1px solid #1E1E2E' }}
        >
          {(['semanas', 'conservados'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={activeTab === tab
                ? { background: '#7C3AED', color: '#fff' }
                : { color: '#52525B' }
              }
            >
              {tab === 'semanas' ? '📅 Semanas' : '🏠 Conservados'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 px-4 py-4 max-w-md mx-auto">

          {/* ── TAB SEMANAS ── */}
          {activeTab === 'semanas' && (
            <>
              {currentUser && otherUser && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-2 px-1" style={{ color: '#52525B' }}>
                    Esta semana
                  </p>
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-3"
                    style={{ background: '#111118', border: '1px solid rgba(124,58,237,0.3)' }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: '#A1A1AA' }}>
                        En curso · {totalWeeklyPoints}/{weeklyObjective} pts
                      </p>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}
                      >
                        En curso
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[currentUser, otherUser].map(u => {
                        const rival = u.id === currentUser.id ? otherUser : currentUser
                        const isWinning = u.weeklyPoints >= rival.weeklyPoints
                        return (
                          <div key={u.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: isWinning ? '#10B981' : '#EF4444' }} />
                              <p className="text-sm font-medium" style={{ color: '#F4F4F5' }}>
                                {u.name} {u.id === profile.id && '(vos)'}
                              </p>
                            </div>
                            <p className="text-sm font-bold" style={{ color: isWinning ? '#10B981' : '#EF4444' }}>
                              {u.weeklyPoints} pts
                            </p>
                          </div>
                        )
                      })}
                    </div>
                    <div
                      className="rounded-xl px-3 py-2.5 text-xs"
                      style={{ background: '#0A0A0F', border: '1px solid #1E1E2E', color: '#71717A' }}
                    >
                      {currentWeekObjectiveReached
                        ? '🎉 Objetivo cumplido — ambos pagan $10.000'
                        : currentLoser
                        ? `⚠️ Si termina así, ${currentLoser.name} paga $20.000`
                        : 'Carguen objetos para sumar puntos'}
                    </div>
                  </div>
                </div>
              )}

              {!loading && history.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-2 px-1" style={{ color: '#52525B' }}>
                    Semanas anteriores
                  </p>
                  <div className="flex flex-col gap-3">
                    {history.map((week, i) => (
                      <motion.div
                        key={week.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-2xl p-4 flex flex-col gap-3"
                        style={{ background: '#111118', border: '1px solid #1E1E2E' }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs" style={{ color: '#52525B' }}>{formatWeekRange(week.week_start)}</p>
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={week.objective_reached
                              ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                              : { background: 'rgba(239,68,68,0.12)', color: '#EF4444' }
                            }
                          >
                            {week.objective_reached ? '✓ Objetivo' : '✗ Sin objetivo'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { name: week.user1_name, pts: week.user1_points, id: week.user1_id },
                            { name: week.user2_name, pts: week.user2_points, id: week.user2_id },
                          ].map(u => {
                            const isLoser = u.id === week.loser_id && !week.objective_reached
                            return (
                              <div key={u.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ background: isLoser ? '#EF4444' : '#10B981' }} />
                                  <p className="text-sm" style={{ color: '#A1A1AA' }}>
                                    {u.name} {u.id === profile.id && '(vos)'}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold" style={{ color: isLoser ? '#EF4444' : '#10B981' }}>
                                  {u.pts} pts
                                </p>
                              </div>
                            )
                          })}
                        </div>
                        <div
                          className="rounded-xl px-3 py-2.5 text-xs font-medium"
                          style={week.objective_reached
                            ? { background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.15)' }
                            : { background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }
                          }
                        >
                          {week.objective_reached
                            ? '💚 Ambos pagan $10.000 para la casa'
                            : `💸 ${week.loser_name} paga $20.000 para la casa`}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <span className="text-5xl">📭</span>
                  <p className="text-sm" style={{ color: '#52525B' }}>
                    El historial de semanas aparece al comenzar una nueva semana.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── TAB CONSERVADOS ── */}
          {activeTab === 'conservados' && (
            <>
              {keptLoading && (
                <div className="flex justify-center py-16">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                    <span className="text-3xl">🏠</span>
                  </motion.div>
                </div>
              )}

              {!keptLoading && keptObjects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <span className="text-5xl">🏷️</span>
                  <p className="text-sm" style={{ color: '#52525B' }}>
                    Todavía no hay objetos marcados para conservar.
                  </p>
                </div>
              )}

              {!keptLoading && keptObjects.length > 0 && (
                <div className="flex flex-col gap-3">
                  {keptObjects.map((obj, i) => (
                    <motion.div
                      key={obj.decision_id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: '#111118', border: '1px solid #1E1E2E' }}
                    >
                      <div className="flex gap-3 p-3">
                        {/* Miniatura */}
                        <div
                          className="shrink-0 w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center"
                          style={{ background: '#0A0A0F' }}
                        >
                          {obj.object_image
                            ? <img src={obj.object_image} alt={obj.object_name} className="w-full h-full object-cover" />
                            : <span className="text-2xl opacity-30">📦</span>
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <p className="font-semibold text-sm truncate" style={{ color: '#F4F4F5' }}>
                            {obj.object_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: '#52525B' }}>
                              {ZONE_EMOJI[obj.object_zone]} {obj.object_zone}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={obj.action === 'dejar_con'
                                ? { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
                                : { background: 'rgba(239,68,68,0.1)', color: '#EF4444' }
                              }
                            >
                              {obj.action === 'dejar_con' ? 'Justificado' : 'Sin justificar'}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: '#3F3F46' }}>
                            {obj.decided_by_name} · {formatDate(obj.decided_at)}
                          </p>
                        </div>
                      </div>

                      {/* Explicación */}
                      {obj.explanation && (
                        <div
                          className="px-3 pb-3"
                        >
                          <div
                            className="rounded-xl px-3 py-2.5 text-xs"
                            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#D4A84B' }}
                          >
                            "{obj.explanation}"
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
