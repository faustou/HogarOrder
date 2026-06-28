import { motion } from 'framer-motion'
import { useHistory } from '../../hooks/useHistory'
import { useWeeklyScores } from '../../hooks/useWeeklyScores'
import type { UserProfile } from '../../types'

interface HistoryProps {
  profile: UserProfile
}

function formatWeekRange(weekStart: string): string {
  const monday = new Date(weekStart + 'T12:00:00')
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  return `${fmt(monday)} — ${fmt(sunday)}`
}

export default function History({ profile }: HistoryProps) {
  const { history, loading } = useHistory()
  const { users, weeklyObjective, totalWeeklyPoints } = useWeeklyScores()

  const currentUser = users.find(u => u.id === profile.id)
  const otherUser = users.find(u => u.id !== profile.id)
  const currentWeekObjectiveReached = totalWeeklyPoints >= weeklyObjective
  const currentLoser = !currentWeekObjectiveReached && currentUser && otherUser
    ? currentUser.weeklyPoints <= otherUser.weeklyPoints ? currentUser : otherUser
    : null

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-5 max-w-md mx-auto">

        <h2
          className="font-display text-2xl font-bold"
          style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#F4F4F5' }}
        >
          Historial
        </h2>

        {/* Semana actual */}
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
                  const isWinning = u.weeklyPoints >= (u.id === currentUser.id ? otherUser.weeklyPoints : currentUser.weeklyPoints)
                  return (
                    <div key={u.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: isWinning ? '#10B981' : '#EF4444' }}
                        />
                        <p className="text-sm font-medium" style={{ color: '#F4F4F5' }}>
                          {u.name} {u.id === profile.id && '(vos)'}
                        </p>
                      </div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: isWinning ? '#10B981' : '#EF4444' }}
                      >
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

        {/* Semanas anteriores */}
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
                    <p className="text-xs" style={{ color: '#52525B' }}>
                      {formatWeekRange(week.week_start)}
                    </p>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={week.objective_reached
                        ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                        : { background: 'rgba(239,68,68,0.12)', color: '#EF4444' }
                      }
                    >
                      {week.objective_reached ? '✓ Objetivo cumplido' : '✗ Objetivo no alcanzado'}
                    </span>
                  </div>

                  {/* Puntos de cada usuario */}
                  <div className="flex flex-col gap-1.5">
                    {[
                      { name: week.user1_name, pts: week.user1_points, id: week.user1_id },
                      { name: week.user2_name, pts: week.user2_points, id: week.user2_id },
                    ].map(u => {
                      const isLoser = u.id === week.loser_id
                      return (
                        <div key={u.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: isLoser && !week.objective_reached ? '#EF4444' : '#10B981' }}
                            />
                            <p className="text-sm" style={{ color: '#A1A1AA' }}>
                              {u.name} {u.id === profile.id && '(vos)'}
                            </p>
                          </div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: isLoser && !week.objective_reached ? '#EF4444' : '#10B981' }}
                          >
                            {u.pts} pts
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Resultado de pago */}
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
              Todavía no hay semanas cerradas. El historial aparece al comenzar una nueva semana.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
