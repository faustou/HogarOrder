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
  // Usar fecha local, no UTC, para evitar el desfase de zona horaria
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, '0')
  const d = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getSundayOfCurrentWeek(): string {
  const now = new Date()
  const day = now.getDay()
  const daysToSunday = day === 0 ? 0 : 7 - day
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + daysToSunday)
  const y = sunday.getFullYear()
  const m = String(sunday.getMonth() + 1).padStart(2, '0')
  const d = String(sunday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
