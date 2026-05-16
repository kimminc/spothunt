import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getHostSession } from '@/lib/session'
import type { EventRoom, EventItem, Participant } from '@/types'

interface LiveScore {
  participant: Participant
  score: number
  itemCount: number
}

export function useHostLive(roomId: string) {
  const router = useRouter()
  const [room, setRoom] = useState<EventRoom | null>(null)
  const [items, setItems] = useState<EventItem[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [scores, setScores] = useState<LiveScore[]>([])
  const [ending, setEnding] = useState(false)

  async function load() {
    const [{ data: r }, { data: i }, { data: p }, { data: rec }] = await Promise.all([
      supabase.from('event_rooms').select('*').eq('id', roomId).single(),
      supabase.from('event_items').select('*').eq('room_id', roomId),
      supabase.from('participants').select('*').eq('room_id', roomId),
      supabase.from('collection_records').select('*').eq('room_id', roomId),
    ])
    if (r) setRoom(r as EventRoom)
    if (i) setItems(i as EventItem[])

    const parts = (p ?? []) as Participant[]
    setParticipants(parts)

    const itemMap = new Map((i as EventItem[] ?? []).map((x) => [x.id, x]))
    const scoreMap = new Map<string, number>()
    const countMap = new Map<string, number>()
    ;(rec ?? []).forEach((record: { participant_id: string; item_id: string }) => {
      const sc = itemMap.get(record.item_id)?.score ?? 0
      scoreMap.set(record.participant_id, (scoreMap.get(record.participant_id) ?? 0) + sc)
      countMap.set(record.participant_id, (countMap.get(record.participant_id) ?? 0) + 1)
    })

    setScores(
      parts
        .map((pt) => ({ participant: pt, score: scoreMap.get(pt.id) ?? 0, itemCount: countMap.get(pt.id) ?? 0 }))
        .sort((a, b) => b.score - a.score)
    )
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`host-live-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'collection_records', filter: `room_id=eq.${roomId}` }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_items', filter: `room_id=eq.${roomId}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  async function endEvent() {
    const session = getHostSession()
    if (!session || session.roomId !== roomId) return
    setEnding(true)
    await supabase
      .from('event_rooms')
      .update({ status: 'ENDED', ended_at: new Date().toISOString() })
      .eq('id', roomId)
    setEnding(false)
    router.push('/')
  }

  const totalCollected = items.reduce((sum, i) => sum + i.collected_count, 0)

  return { room, items, participants, scores, totalCollected, ending, endEvent }
}
