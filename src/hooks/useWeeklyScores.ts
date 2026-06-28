import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getMondayOfCurrentWeek, getSundayOfCurrentWeek } from '../lib/rules'

export interface WeeklyUserScore {
  id: string
  name: string
  weeklyPoints: number
  totalPoints: number
}

export interface WeeklyScores {
  users: WeeklyUserScore[]
  weeklyObjective: number
  totalWeeklyPoints: number
  loading: boolean
}

export function useWeeklyScores(): WeeklyScores & { refetch: () => void } {
  const [data, setData] = useState<WeeklyScores>({
    users: [],
    weeklyObjective: 300,
    totalWeeklyPoints: 0,
    loading: true,
  })

  const fetch = useCallback(async () => {
    const weekStart = getMondayOfCurrentWeek()
    const weekEnd = getSundayOfCurrentWeek()

    const [usersRes, txRes, configRes] = await Promise.all([
      supabase.from('users').select('id, name, total_points'),
      supabase.from('point_transactions').select('user_id, points')
        .gte('week_start', weekStart)
        .lte('week_start', weekEnd),
      supabase.from('app_config').select('value').eq('key', 'weekly_objective').single(),
    ])

    const users = usersRes.data ?? []
    const transactions = txRes.data ?? []
    const weeklyObjective = parseInt(configRes.data?.value ?? '300', 10)

    const scores: WeeklyUserScore[] = users.map(u => ({
      id: u.id,
      name: u.name,
      weeklyPoints: transactions
        .filter(t => t.user_id === u.id)
        .reduce((sum, t) => sum + t.points, 0),
      totalPoints: u.total_points,
    }))

    const totalWeeklyPoints = scores.reduce((sum, u) => sum + u.weeklyPoints, 0)

    setData({ users: scores, weeklyObjective, totalWeeklyPoints, loading: false })
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { ...data, refetch: fetch }
}
