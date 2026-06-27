export function canResolve(ownUploads: number, ownResolutions: number): boolean {
  return ownUploads >= (ownResolutions + 1) * 3
}

export function uploadsNeededToResolve(ownUploads: number, ownResolutions: number): number {
  const required = (ownResolutions + 1) * 3
  return Math.max(0, required - ownUploads)
}

export function getMondayOfCurrentWeek(): string {
  const now = new Date()
  const day = now.getDay()
  const daysToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + daysToMonday)
  return monday.toISOString().split('T')[0]
}
