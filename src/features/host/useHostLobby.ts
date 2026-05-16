import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getHostSession } from '@/lib/session'
import type { EventRoom, Participant } from '@/types'

export function useHostLobby(roomId: string) {
  const router = useRouter()
  const [room, setRoom] = useState<EventRoom | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const refresh = useCallback(async () => {
    const [{ data: roomData }, { data: pList }] = await Promise.all([
      supabase.from('event_rooms').select('*').eq('id', roomId).single(),
      supabase.from('participants').select('*').eq('room_id', roomId).order('joined_at'),
    ])
    if (roomData) setRoom(roomData as EventRoom)
    if (pList) setParticipants(pList as Participant[])
    setLoading(false)
  }, [roomId])

  // 초기 로드
  useEffect(() => { refresh() }, [refresh])

  // Realtime 구독 + 3초 폴링 (Realtime 미활성화 환경 대비)
  useEffect(() => {
    const channel = supabase
      .channel(`host-lobby-${roomId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        () => refresh()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        () => refresh()
      )
      .subscribe((status) => {
        console.log('[HostLobby] Realtime status:', status)
      })

    // 폴링 fallback — Realtime이 작동 안 할 경우 3초마다 갱신
    const timer = setInterval(refresh, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [roomId, refresh])

  async function startEvent() {
    const session = getHostSession()
    if (!session || session.roomId !== roomId) {
      setError('주최자 세션이 유효하지 않습니다.')
      return
    }
    setStarting(true)
    const { error: dbError } = await supabase
      .from('event_rooms')
      .update({ status: 'RUNNING', started_at: new Date().toISOString() })
      .eq('id', roomId)
    if (dbError) { setError(dbError.message); setStarting(false); return }
    router.push(`/host/${roomId}/live`)
  }

  async function deleteRoom() {
    const { error: dbError } = await supabase
      .from('event_rooms')
      .update({ status: 'CANCELLED' })
      .eq('id', roomId)
    if (!dbError) router.push('/')
  }

  return { room, participants, loading, error, starting, startEvent, deleteRoom, refresh }
}
