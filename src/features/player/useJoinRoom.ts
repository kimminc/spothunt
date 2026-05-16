import { useState } from 'react'
import { useRouter } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { savePlayerSession } from '@/lib/session'
import type { EventRoom } from '@/types'

export function useSearchRooms() {
  const [rooms, setRooms] = useState<EventRoom[]>([])
  const [loading, setLoading] = useState(false)

  async function search(query: string) {
    if (!query.trim()) { setRooms([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('event_rooms')
      .select('*')
      .ilike('room_name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)
    setRooms(data ?? [])
    setLoading(false)
  }

  return { rooms, loading, search }
}

export function useJoinRoom(roomId: string) {
  const router = useRouter()
  const [room, setRoom] = useState<EventRoom | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadRoom() {
    const { data } = await supabase
      .from('event_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    setRoom(data)
  }

  async function join(password: string, nickname: string) {
    if (!room) return
    setLoading(true)
    setError(null)
    try {
      // 비밀번호 검증
      const ok = await bcrypt.compare(password, room.password_hash)
      if (!ok) { setError('비밀번호가 맞지 않습니다.'); return }

      const sessionToken = uuidv4()
      const { data, error: dbError } = await supabase
        .from('participants')
        .insert({ room_id: roomId, nickname, session_token: sessionToken })
        .select()
        .single()

      if (dbError) {
        if (dbError.code === '23505') setError('이미 사용 중인 닉네임입니다.')
        else setError(dbError.message)
        return
      }

      savePlayerSession({ participantId: data.id, sessionToken, nickname, roomId })
      router.push(`/join/${roomId}/lobby`)
    } finally {
      setLoading(false)
    }
  }

  return { room, loading, error, loadRoom, join }
}
