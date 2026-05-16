import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPlayerSession } from '@/lib/session'
import type { EventRoom } from '@/types'

export function usePlayerLobby(roomId: string) {
  const router = useRouter()
  const [room, setRoom] = useState<EventRoom | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getPlayerSession()
    if (!session || session.roomId !== roomId) {
      router.replace(`/join/${roomId}`)
      return
    }

    async function load() {
      const [{ data: roomData }, { count }] = await Promise.all([
        supabase.from('event_rooms').select('*').eq('id', roomId).single(),
        supabase.from('participants').select('*', { count: 'exact', head: true }).eq('room_id', roomId),
      ])
      if (roomData) setRoom(roomData)
      setParticipantCount(count ?? 0)
      setLoading(false)

      // 이미 RUNNING이면 바로 이동
      if (roomData?.status === 'RUNNING') router.replace(`/join/${roomId}/play`)
    }
    load()
  }, [roomId, router])

  // 이벤트 상태 실시간 구독 — RUNNING 되면 자동 이동
  useEffect(() => {
    const channel = supabase
      .channel(`player-lobby-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as EventRoom
          setRoom(updated)
          if (updated.status === 'RUNNING') router.replace(`/join/${roomId}/play`)
          if (updated.status === 'CANCELLED') router.replace('/')
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        () => setParticipantCount((n) => n + 1)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId, router])

  return { room, participantCount, loading }
}
