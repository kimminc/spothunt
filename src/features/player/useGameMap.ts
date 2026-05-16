import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { getPlayerSession } from '@/lib/session'
import { getDistanceMeters } from '@/lib/geo'
import type { EventRoom, EventItem } from '@/types'

export interface GameItem extends EventItem {
  isCollected: boolean
  isSoldOut: boolean
  distanceM: number | null
  isNearby: boolean    // 픽업 반경 안 — 획득 버튼 활성화
  isRevealed: boolean  // 탐지 반경 안 — 지도에 표시
}

// 탐지 반경: 픽업 반경 × 5, 최소 80m
function revealRadius(pickupM: number) {
  return Math.max(pickupM * 5, 80)
}

export function useGameMap(roomId: string, userLat: number | null, userLng: number | null) {
  const [room, setRoom] = useState<EventRoom | null>(null)
  const [items, setItems] = useState<EventItem[]>([])
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const session = getPlayerSession()
    if (!session) return

    async function load() {
      const [{ data: r }, { data: i }, { data: myRec }] = await Promise.all([
        supabase.from('event_rooms').select('*').eq('id', roomId).single(),
        supabase.from('event_items').select('*').eq('room_id', roomId),
        supabase.from('collection_records').select('item_id').eq('participant_id', session!.participantId),
      ])
      if (r) setRoom(r as EventRoom)
      if (i) setItems(i as EventItem[])
      if (myRec) setCollectedIds(new Set(myRec.map((x: { item_id: string }) => x.item_id)))
    }
    load()
  }, [roomId])

  // 아이템 collected_count 실시간 갱신
  useEffect(() => {
    const channel = supabase
      .channel(`game-${roomId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_items', filter: `room_id=eq.${roomId}` },
        (payload) => setItems((prev) =>
          prev.map((it) => it.id === payload.new.id ? { ...it, ...(payload.new as EventItem) } : it)
        )
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'collection_records', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const session = getPlayerSession()
          if (payload.new.participant_id === session?.participantId) {
            setCollectedIds((prev) => { const s = new Set(prev); s.add(payload.new.item_id as string); return s })
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  const gameItems: GameItem[] = useMemo(() => items.map((item) => {
    const distanceM = (userLat !== null && userLng !== null)
      ? getDistanceMeters(userLat, userLng, item.latitude, item.longitude)
      : null
    const isCollected = collectedIds.has(item.id)
    return {
      ...item,
      isCollected,
      isSoldOut: item.max_winners !== null && item.collected_count >= item.max_winners,
      distanceM,
      isNearby: distanceM !== null && distanceM <= item.pickup_radius_meter,
      // 탐지 반경 안이거나, 이미 획득한 경우 표시 (획득 아이템은 위치 기억하도록)
      isRevealed: isCollected || (distanceM !== null && distanceM <= revealRadius(item.pickup_radius_meter)),
    }
  }), [items, collectedIds, userLat, userLng])

  return { room, gameItems }
}
