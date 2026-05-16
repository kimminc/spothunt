export type EventMode = 'ALL' | 'COMPETITION'
export type EventStatus = 'WAITING' | 'RUNNING' | 'ENDED' | 'CANCELLED'

export interface EventRoom {
  id: string
  room_name: string
  password_hash: string
  host_token: string
  mode: EventMode
  status: EventStatus
  description: string | null
  center_lat: number
  center_lng: number
  boundary_radius_meter: number
  max_players: number | null
  created_at: string
  started_at: string | null
  ended_at: string | null
}

export interface EventItem {
  id: string
  room_id: string
  name: string
  image_key: string
  score: number
  latitude: number
  longitude: number
  pickup_radius_meter: number
  max_winners: number | null
  collected_count: number
  created_at: string
}

export interface Participant {
  id: string
  room_id: string
  nickname: string
  session_token: string
  joined_at: string
}

export interface CollectionRecord {
  id: string
  room_id: string
  participant_id: string
  item_id: string
  collected_at: string
}

export interface PlayerSession {
  participantId: string
  sessionToken: string
  nickname: string
  roomId: string
}

export interface HostSession {
  hostToken: string
  roomId: string
}

export const ITEM_IMAGES = {
  treasure: '🏆',
  cat: '🐱',
  dragon: '🐉',
  coupon: '🎫',
  mission: '📋',
  star: '⭐',
  gem: '💎',
  gift: '🎁',
} as const

export type ItemImageKey = keyof typeof ITEM_IMAGES
