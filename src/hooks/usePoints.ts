import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getMondayOfCurrentWeek, getSundayOfCurrentWeek } from '../lib/rules'
import type { UserStats } from '../types'

export function usePoints(userId: string) {
  const [stats, setStats] = useState<UserStats>({ uploads: 0, resolutions: 0, weeklyPoints: 0 })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const weekStart = getMondayOfCurrentWeek()
    const weekEnd = getSundayOfCurrentWeek()

    const [uploadsRes, resolutionsRes, weeklyRes] = await Promise.all([
      supabase
        .from('objects')
        .select('id', { count: 'exact', head: true })
        .eq('uploaded_by', userId),
      supabase
        .from('decisions')
        .select('id', { count: 'exact', head: true })
        .eq('decided_by', userId)
        .neq('action', 'posponer'),
      supabase
        .from('point_transactions')
        .select('points')
        .eq('user_id', userId)
        .gte('week_start', weekStart)
        .lte('week_start', weekEnd),
    ])

    const weeklyPoints = (weeklyRes.data ?? []).reduce((sum, t) => sum + t.points, 0)

    setStats({
      uploads: uploadsRes.count ?? 0,
      resolutions: resolutionsRes.count ?? 0,
      weeklyPoints,
    })
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  return { stats, loading, refetch: fetch }
}
