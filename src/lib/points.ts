import type { DecisionOption } from '../types'

export const POINTS_UPLOAD = 5

export const POINTS_BY_DECISION: Record<DecisionOption, number> = {
  tirar: 10,
  donar: 15,
  reubicar: 7,
  dejar_con: 0,
  posponer: -5,
  dejar_sin: -10,
}

export function getDecisionPoints(decision: DecisionOption): number {
  return POINTS_BY_DECISION[decision]
}

export function getTotalPointsForAction(isUpload: boolean, decision?: DecisionOption): number {
  if (isUpload) return POINTS_UPLOAD
  if (decision) return getDecisionPoints(decision)
  return 0
}
