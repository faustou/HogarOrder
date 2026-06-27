import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getDecisionPoints } from '../lib/points'
import { getMondayOfCurrentWeek } from '../lib/rules'
import type { DecisionOption, HogarObject } from '../types'

export function useObjects(userId: string) {
  const [current, setCurrent] = useState<HogarObject | null>(null)
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)
  const [resolving, setResolving] = useState(false)

  const fetchNext = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('objects')
      .select('*')
      .eq('status', 'pending')
      .order('queue_position', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (data) {
      setCurrent(data as HogarObject)
      setEmpty(false)
    } else {
      setCurrent(null)
      setEmpty(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchNext() }, [fetchNext])

  async function resolve(action: DecisionOption, explanation?: string) {
    if (!current || resolving) return
    setResolving(true)

    const points = getDecisionPoints(action)
    const weekStart = getMondayOfCurrentWeek()

    await supabase.from('decisions').insert({
      object_id: current.id,
      decided_by: userId,
      action,
      explanation: explanation ?? null,
      points_awarded: points,
    })

    if (action === 'posponer') {
      const { data: last } = await supabase
        .from('objects')
        .select('queue_position')
        .eq('status', 'pending')
        .order('queue_position', { ascending: false })
        .limit(1)
        .maybeSingle()

      await supabase
        .from('objects')
        .update({ queue_position: (last?.queue_position ?? 0) + 1 })
        .eq('id', current.id)
    } else {
      await supabase
        .from('objects')
        .update({ status: 'resolved' })
        .eq('id', current.id)
    }

    await supabase.from('point_transactions').insert({
      user_id: userId,
      points,
      reason: action,
      reference_id: current.id,
      week_start: weekStart,
    })

    setResolving(false)
    fetchNext()
  }

  return { current, loading, empty, resolving, resolve }
}
