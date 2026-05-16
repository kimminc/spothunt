import { useState, useEffect } from 'react'

interface GeoState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: null, lng: null, accuracy: null, error: null, loading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: '이 브라우저는 위치 서비스를 지원하지 않습니다.', loading: false }))
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      (err) => {
        const messages: Record<number, string> = {
          1: '위치 권한이 거부됐습니다. 브라우저 설정에서 위치 허용 후 새로고침 해주세요.',
          2: '위치 정보를 사용할 수 없습니다.',
          3: '위치 요청 시간이 초과됐습니다.',
        }
        setState((s) => ({ ...s, error: messages[err.code] ?? '위치를 가져올 수 없습니다.', loading: false }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return state
}
