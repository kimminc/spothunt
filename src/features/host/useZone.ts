import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { EventRoom } from '@/types'

export function useZone(roomId: string) {
  const router = useRouter()
  const [room, setRoom] = useState<EventRoom | null>(null)
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(300)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)

  useEffect(() => {
    supabase.from('event_rooms').select('*').eq('id', roomId).single()
      .then(({ data }) => {
        if (!data) return
        setRoom(data as EventRoom)
        if (data.center_lat && data.center_lat !== 0) {
          setCenter({ lat: data.center_lat, lng: data.center_lng })
          setRadius(data.boundary_radius_meter)
        } else {
          setGpsLoading(true)
          navigator.geolocation?.getCurrentPosition(
            (pos) => {
              setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
              setGpsLoading(false)
            },
            () => setGpsLoading(false)
          )
        }
      })
  }, [roomId])

  function handleMapClick(lat: number, lng: number) {
    setCenter({ lat, lng })
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('위치 권한이 거부되었습니다.')
    )
  }

  async function saveZone() {
    if (!center) { setError('지도를 클릭해 중심 위치를 선택하세요.'); return }
    setSaving(true)
    const { error: dbError } = await supabase
      .from('event_rooms')
      .update({ center_lat: center.lat, center_lng: center.lng, boundary_radius_meter: radius })
      .eq('id', roomId)
    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    router.push(`/host/${roomId}/items`)
  }

  return { room, center, radius, setRadius, saving, error, gpsLoading, handleMapClick, useCurrentLocation, saveZone }
}
