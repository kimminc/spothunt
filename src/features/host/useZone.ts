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

  useEffect(() => {
    // DB에서 기존 설정 로드
    supabase.from('event_rooms').select('*').eq('id', roomId).single()
      .then(({ data }) => {
        if (!data) return
        setRoom(data as EventRoom)
        if (data.center_lat && data.center_lat !== 0) {
          // 기존 저장된 위치가 있으면 그걸 사용
          setCenter({ lat: data.center_lat, lng: data.center_lng })
          setRadius(data.boundary_radius_meter)
        } else {
          // 없으면 현재 위치로 자동 초기화
          navigator.geolocation?.getCurrentPosition(
            (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {}  // 권한 거부 시 무시 (버튼으로 재시도 가능)
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

  return { room, center, radius, setRadius, saving, error, handleMapClick, useCurrentLocation, saveZone }
}
