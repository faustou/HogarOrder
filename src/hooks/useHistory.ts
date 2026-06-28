import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getMondayOfCurrentWeek } from '../lib/rules'

export interface WeekResult {
  id: string
  week_start: string
  user1_id: string
  user1_name: string
  user1_points: number
  user2_id: string
  user2_name: string
  user2_points: number
  objective: number
  objective_reached: boolean
  loser_id: string | null
  loser_name: string | null
  closed: boolean
}

export function useHistory() {
  const [history, setHistory] = useState<WeekResult[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    const currentMonday = getMondayOfCurrentWeek()

    // Traer usuarios, ciclos ya cerrados y config
    const [usersRes, cyclesRes, configRes] = await Promise.all([
      supabase.from('users').select('id, name'),
      supabase.from('weekly_cycles').select('*').order('week_start', { ascending: false }),
      supabase.from('app_config').select('value').eq('key', 'weekly_objective').single(),
    ])

    const users = usersRes.data ?? []
    const closedCycles = cyclesRes.data ?? []
    const objective = parseInt(configRes.data?.value ?? '300', 10)

    // Buscar semanas pasadas que aún no están cerradas
    const closedWeeks = new Set(closedCycles.map(c => c.week_start))
    const { data: pastTx } = await supabase
      .from('point_transactions')
      .select('user_id, points, week_start')
      .lt('week_start', currentMonday)

    const pastWeeks = [...new Set((pastTx ?? []).map(t => t.week_start))]
    const openPastWeeks = pastWeeks.filter(w => !closedWeeks.has(w))

    // Cerrar semanas pendientes
    for (const weekStart of openPastWeeks) {
      const weekTx = (pastTx ?? []).filter(t => t.week_start === weekStart)
      const pointsByUser: Record<string, number> = {}
      for (const tx of weekTx) {
        pointsByUser[tx.user_id] = (pointsByUser[tx.user_id] ?? 0) + tx.points
      }

      const [u1, u2] = users
      if (!u1 || !u2) continue

      const u1pts = pointsByUser[u1.id] ?? 0
      const u2pts = pointsByUser[u2.id] ?? 0
      const total = u1pts + u2pts
      const objectiveReached = total >= objective
      const loserId = objectiveReached ? null : u1pts <= u2pts ? u1.id : u2.id

      await supabase.from('weekly_cycles').upsert({
        week_start: weekStart,
        user1_points: u1pts,
        user2_points: u2pts,
        objective,
        objective_reached: objectiveReached,
        loser_id: loserId,
        closed: true,
        closed_at: new Date().toISOString(),
      }, { onConflict: 'week_start' })
    }

    // Volver a traer ciclos actualizados
    const { data: allCycles } = await supabase
      .from('weekly_cycles')
      .select('*')
      .order('week_start', { ascending: false })

    const results: WeekResult[] = (allCycles ?? []).map(c => {
      const u1 = users.find(u => u.id === (users[0]?.id)) ?? users[0]
      const u2 = users.find(u => u.id !== (users[0]?.id)) ?? users[1]
      const loser = users.find(u => u.id === c.loser_id)
      return {
        id: c.id,
        week_start: c.week_start,
        user1_id: u1?.id ?? '',
        user1_name: u1?.name ?? '',
        user1_points: c.user1_points,
        user2_id: u2?.id ?? '',
        user2_name: u2?.name ?? '',
        user2_points: c.user2_points,
        objective: c.objective,
        objective_reached: c.objective_reached,
        loser_id: c.loser_id,
        loser_name: loser?.name ?? null,
        closed: c.closed,
      }
    })

    setHistory(results)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { history, loading, refetch: fetch }
}
