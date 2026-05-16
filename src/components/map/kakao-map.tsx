'use client'

import { useEffect, useRef, useState } from 'react'
import { loadKakaoMapScript } from '@/lib/kakaomap'

export interface MapMarker {
  lat: number
  lng: number
  emoji?: string
  dimmed?: boolean
}

export interface MapZone {
  lat: number
  lng: number
  radiusM: number
}

interface KakaoMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: MapMarker[]
  zone?: MapZone | null
  pin?: { lat: number; lng: number } | null
  myLocation?: { lat: number; lng: number } | null  // 내 위치 (파란 점)
  onClick?: (lat: number, lng: number) => void
  className?: string
}

/* eslint-disable */
type K = any

export default function KakaoMap({
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 4,
  markers = [],
  zone = null,
  pin = null,
  myLocation = null,
  onClick,
  className = 'w-full h-full',
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<K>(null)
  const overlaysRef = useRef<K[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 지도 초기화 — StrictMode 이중 마운트 방지
  useEffect(() => {
    let cancelled = false

    loadKakaoMapScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        // 이미 초기화됐으면 스킵 (StrictMode 보호)
        if (mapRef.current) { setLoading(false); return }

        const kakao = window.kakao
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level: zoom,
        })
        mapRef.current = map

        if (onClick) {
          kakao.maps.event.addListener(map, 'click', (e: K) => {
            onClick(e.latLng.getLat(), e.latLng.getLng())
          })
        }

        // flex 컨테이너에서 높이가 늦게 결정되므로 relayout 호출
        setTimeout(() => { if (!cancelled) map.relayout() }, 100)
        setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) setMapError(err.message)
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // center prop 변경 시 지도 자동 이동 (GPS 로드 후 초기 센터링에 사용)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.kakao?.maps?.LatLng) return
    map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng))
  }, [center.lat, center.lng])

  // 오버레이(마커·구역·핀) 동기화
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.kakao?.maps?.Map) return
    const kakao = window.kakao

    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    if (zone) {
      const circle = new kakao.maps.Circle({
        map,
        center: new kakao.maps.LatLng(zone.lat, zone.lng),
        radius: zone.radiusM,
        strokeWeight: 2, strokeColor: '#6366f1', strokeOpacity: 0.8,
        fillColor: '#818cf8', fillOpacity: 0.15,
      })
      overlaysRef.current.push(circle)
    }

    markers.forEach((m) => {
      const overlay = new kakao.maps.CustomOverlay({
        map,
        position: new kakao.maps.LatLng(m.lat, m.lng),
        content: `<div style="font-size:28px;line-height:1;opacity:${m.dimmed ? 0.3 : 1};filter:${m.dimmed ? 'grayscale(1)' : 'none'}">${m.emoji ?? '📍'}</div>`,
        yAnchor: 1,
      })
      overlaysRef.current.push(overlay)
    })

    if (pin) {
      const marker = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(pin.lat, pin.lng),
      })
      overlaysRef.current.push(marker)
    }

    // 내 위치 — 파란 점
    if (myLocation) {
      const dot = new kakao.maps.CustomOverlay({
        map,
        position: new kakao.maps.LatLng(myLocation.lat, myLocation.lng),
        content: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.3)"></div>',
        yAnchor: 0.5,
        zIndex: 10,
      })
      overlaysRef.current.push(dot)

      // 내 위치로 지도 중심 이동
      map.setCenter(new kakao.maps.LatLng(myLocation.lat, myLocation.lng))
    }
  }, [markers, zone, pin, myLocation])

  if (mapError) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-100 gap-3 p-6 text-center`}>
        <div className="text-4xl">🗺️</div>
        <p className="text-sm font-semibold text-red-500">지도를 불러올 수 없습니다</p>
        <div className="rounded-xl bg-white p-4 text-left shadow text-xs space-y-2 max-w-xs">
          <p className="font-medium text-gray-700">해결 방법:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-500">
            <li>카카오 개발자 콘솔 접속</li>
            <li>앱 선택 → 플랫폼 → Web</li>
            <li>사이트 도메인에 추가:</li>
          </ol>
          <code className="block rounded bg-gray-100 px-2 py-1 text-center font-bold">http://localhost</code>
          <p className="text-gray-400">(포트 번호 없이 등록)</p>
        </div>
        <p className="text-xs text-red-400">{mapError}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-400">지도 로딩 중...</p>
        </div>
      )}
    </div>
  )
}
