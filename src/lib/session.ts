import type { HostSession, PlayerSession } from '@/types'

const HOST_KEY = 'spothunt_host'
const PLAYER_KEY = 'spothunt_player'

export function saveHostSession(session: HostSession) {
  localStorage.setItem(HOST_KEY, JSON.stringify(session))
}

export function getHostSession(): HostSession | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(HOST_KEY)
  return raw ? JSON.parse(raw) : null
}

export function savePlayerSession(session: PlayerSession) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(session))
}

export function getPlayerSession(): PlayerSession | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PLAYER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearSessions() {
  localStorage.removeItem(HOST_KEY)
  localStorage.removeItem(PLAYER_KEY)
}
