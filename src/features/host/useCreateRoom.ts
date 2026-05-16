import { useState } from 'react'
import { useRouter } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { saveHostSession } from '@/lib/session'
import type { EventMode } from '@/types'

interface CreateRoomInput {
  roomName: string
  password: string
  mode: EventMode
  description?: string
  maxPlayers?: number
}

export function useCreateRoom() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createRoom(input: CreateRoomInput) {
    setLoading(true)
    setError(null)
    try {
      const passwordHash = await bcrypt.hash(input.password, 10)
      const hostToken = uuidv4()

      const { data, error: dbError } = await supabase
        .from('event_rooms')
        .insert({
          room_name: input.roomName,
          password_hash: passwordHash,
          host_token: hostToken,
          mode: input.mode,
          description: input.description ?? null,
          max_players: input.maxPlayers ?? null,
          // 임시 좌표 — 구역 설정 화면에서 업데이트
          center_lat: 0,
          center_lng: 0,
          boundary_radius_meter: 300,
          status: 'WAITING',
        })
        .select()
        .single()

      if (dbError) throw new Error(dbError.message)

      saveHostSession({ hostToken, roomId: data.id })
      router.push(`/host/${data.id}/zone`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '방 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return { createRoom, loading, error }
}
