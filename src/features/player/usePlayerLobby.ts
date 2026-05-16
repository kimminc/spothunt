import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPlayerSession } from '@/lib/session'
import type { EventRoom } from '@/types'

export function usePlayerLobby(roomId: string) {
  const router = useRouter()
  const [room, setRoom] = useState<EventRoom | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [{ data: roomData }, { count }] = await Promise.all([
      supabase.from('event_rooms').select('*').eq('id', roomId).single(),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('room_id', roomId),
    ])
    if (roomData) {
      setRoom(roomData as EventRoom)
      if (roomData.status === 'RUNNING') router.replace(`/join/${roomId}/play`)
      if (roomData.status === 'CANCELLED') router.replace('/')
    }
    setParticipantCount(count ?? 0)
    setLoading(false)
  }, [roomId, router])

  useEffect(() => {
    const session = getPlayerSession()
    if (!session || session.roomId !== roomId) {
      router.replace(`/join/${roomId}`)
      return
    }
    refresh()
  }, [roomId, router, refresh])

  // Realtime + 2초 폴링 (Realtime 미활성화 대비)
  useEffect(() => {
    const channel = supabase
      .channel(`player-lobby-${roomId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as EventRoom
          setRoom(updated)
          if (updated.status === 'RUNNING') router.replace(`/join/${roomId}/play`)
          if (updated.status === 'CANCELLED') router.replace('/')
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        () => refresh()
      )
      .subscribe((status) => {
        console.log('[PlayerLobby] Realtime status:', status)
      })

    // 폴링 fallback — 2초마다 상태 확인
    const timer = setInterval(refresh, 2000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [roomId, router, refresh])

  return { room, participantCount, loading }
}
