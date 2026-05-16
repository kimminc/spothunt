import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getPlayerSession } from '@/lib/session'
import type { Participant, CollectionRecord, EventItem } from '@/types'

export interface PlayerScore {
  participant: Participant
  score: number
  itemCount: number
}

export function useScoreBoard(roomId: string) {
  const [scores, setScores] = useState<PlayerScore[]>([])
  const [myRecords, setMyRecords] = useState<(CollectionRecord & { item: EventItem })[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const session = getPlayerSession()
    const [{ data: parts }, { data: records }, { data: items }] = await Promise.all([
      supabase.from('participants').select('*').eq('room_id', roomId),
      supabase.from('collection_records').select('*').eq('room_id', roomId),
      supabase.from('event_items').select('*').eq('room_id', roomId),
    ])

    if (!parts || !records || !items) return

    const itemMap = new Map((items as EventItem[]).map((i) => [i.id, i]))
    const scoreMap = new Map<string, number>()

    ;(records as CollectionRecord[]).forEach((r) => {
      const score = itemMap.get(r.item_id)?.score ?? 0
      scoreMap.set(r.participant_id, (scoreMap.get(r.participant_id) ?? 0) + score)
    })

    const sorted: PlayerScore[] = (parts as Participant[])
      .map((p) => ({
        participant: p,
        score: scoreMap.get(p.id) ?? 0,
        itemCount: (records as CollectionRecord[]).filter((r) => r.participant_id === p.id).length,
      }))
      .sort((a, b) => b.score - a.score)

    setScores(sorted)

    if (session) {
      const mine = (records as CollectionRecord[])
        .filter((r) => r.participant_id === session.participantId)
        .map((r) => ({ ...r, item: itemMap.get(r.item_id)! }))
        .filter((r) => r.item)
      setMyRecords(mine)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`score-${roomId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'collection_records', filter: `room_id=eq.${roomId}` },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  return { scores, myRecords, loading }
}
