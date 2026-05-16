import { useState, useEffect } from 'react'
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

  // 초기 데이터 로드
  useEffect(() => {
    async function load() {
      const [{ data: roomData }, { data: pList }] = await Promise.all([
        supabase.from('event_rooms').select('*').eq('id', roomId).single(),
        supabase.from('participants').select('*').eq('room_id', roomId),
      ])
      if (roomData) setRoom(roomData)
      if (pList) setParticipants(pList)
      setLoading(false)
    }
    load()
  }, [roomId])

  // 참여자 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel(`lobby-participants-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        (payload) => setParticipants((prev) => [...prev, payload.new as Participant])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId])

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
    if (dbError) {
      setError(dbError.message)
      setStarting(false)
      return
    }
    router.push(`/host/${roomId}/live`)
  }

  async function deleteRoom() {
    const { error: dbError } = await supabase
      .from('event_rooms')
      .update({ status: 'CANCELLED' })
      .eq('id', roomId)
    if (!dbError) router.push('/')
  }

  return { room, participants, loading, error, starting, startEvent, deleteRoom }
}
