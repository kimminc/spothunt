import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { EventItem, EventRoom, ItemImageKey } from '@/types'

export interface NewItemForm {
  name: string
  imageKey: ItemImageKey
  score: number
  pickupRadius: number
  maxWinners: number | null
  lat: number
  lng: number
}

const defaultForm = (): NewItemForm => ({
  name: '',
  imageKey: 'treasure',
  score: 10,
  pickupRadius: 20,
  maxWinners: null,
  lat: 0,
  lng: 0,
})

export function useRoomItems(roomId: string) {
  const [room, setRoom] = useState<EventRoom | null>(null)
  const [items, setItems] = useState<EventItem[]>([])
  const [form, setForm] = useState<NewItemForm>(defaultForm())
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('event_rooms').select('*').eq('id', roomId).single(),
      supabase.from('event_items').select('*').eq('room_id', roomId).order('created_at'),
    ]).then(([{ data: r }, { data: i }]) => {
      if (r) setRoom(r as EventRoom)
      if (i) setItems(i as EventItem[])
    })
  }, [roomId])

  function openFormAt(lat: number, lng: number) {
    setForm({ ...defaultForm(), lat, lng })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setError(null)
  }

  async function addItem() {
    if (!form.name.trim()) { setError('아이템 이름을 입력하세요.'); return }
    setSaving(true)
    const { data, error: dbError } = await supabase
      .from('event_items')
      .insert({
        room_id: roomId,
        name: form.name,
        image_key: form.imageKey,
        score: form.score,
        latitude: form.lat,
        longitude: form.lng,
        pickup_radius_meter: form.pickupRadius,
        max_winners: form.maxWinners,
      })
      .select()
      .single()
    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    setItems((prev) => [...prev, data as EventItem])
    closeForm()
  }

  async function deleteItem(itemId: string) {
    await supabase.from('event_items').delete().eq('id', itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  return { room, items, form, setForm, showForm, saving, error, openFormAt, closeForm, addItem, deleteItem }
}
