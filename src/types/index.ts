export type Zone = 'living' | 'cocina' | 'baño' | 'dormitorio' | 'patio' | 'otro'

export type ObjectStatus = 'pending' | 'resolved' | 'postponed'

export type DecisionOption = 'tirar' | 'donar' | 'reubicar' | 'dejar_con' | 'posponer' | 'dejar_sin'

export interface HogarObject {
  id: string
  uploaded_by: string
  name: string
  zone: Zone
  image_url: string | null
  status: ObjectStatus
  queue_position: number
  created_at: string
}

export interface UserProfile {
  id: string
  name: string
  role: 'admin' | 'member'
  total_points: number
  created_at: string
}

export interface UserStats {
  uploads: number
  resolutions: number
  weeklyPoints: number
}
