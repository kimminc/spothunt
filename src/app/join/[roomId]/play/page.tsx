'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGeolocation } from '@/features/shared/useGeolocation'
import { useGameMap } from '@/features/player/useGameMap'
import { useCollectItem } from '@/features/player/useCollectItem'
import { supabase } from '@/lib/supabase'
import { ITEM_IMAGES, type ItemImageKey } from '@/types'

const KakaoMap = dynamic(() => import('@/components/map/kakao-map'), { ssr: false })

export default function PlayPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const { lat, lng, error: gpsError, loading: gpsLoading } = useGeolocation()
  const { room, gameItems } = useGameMap(roomId, lat, lng)
  const { collect, collecting, getResultMessage } = useCollectItem()

  // 이벤트 종료 감지 → 점수판으로 자동 이동
  useEffect(() => {
    const channel = supabase
      .channel(`play-status-${roomId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_rooms', filter: `id=eq.${roomId}` },
        (payload) => { if (payload.new.status === 'ENDED') router.replace(`/join/${roomId}/score`) }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId, router])

  const zone = room ? { lat: room.center_lat, lng: room.center_lng, radiusM: room.boundary_radius_meter } : null
  const mapCenter = lat && lng ? { lat, lng } : (room ? { lat: room.center_lat, lng: room.center_lng } : undefined)

  // 탐지 반경 안에 든 아이템만 지도에 표시 (미발견 아이템은 숨김)
  const markers = gameItems
    .filter((item) => item.isRevealed)
    .map((item) => ({
      lat: item.latitude,
      lng: item.longitude,
      emoji: ITEM_IMAGES[item.image_key as ItemImageKey] ?? '📍',
      dimmed: item.isCollected || item.isSoldOut,
    }))

  // 반경 안에 있고 아직 획득 안 한 아이템
  const nearbyItem = gameItems.find((i) => i.isNearby && !i.isCollected && !i.isSoldOut)

  const resultMsg = getResultMessage()

  // GPS 권한 거부
  if (gpsError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center gap-4">
        <div className="text-5xl">📡</div>
        <h1 className="text-lg font-bold text-red-500">위치 권한 필요</h1>
        <p className="text-sm text-gray-500">{gpsError}</p>
        <button onClick={() => window.location.reload()}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white">
          다시 시도
        </button>
      </main>
    )
  }

  return (
    <main className="flex h-screen flex-col">
      {/* 지도 */}
      <div className="relative flex-1 min-h-0">
        <KakaoMap
          center={mapCenter}
          zoom={4}
          markers={markers}
          zone={zone}
          myLocation={lat && lng ? { lat, lng } : null}
          className="h-full w-full"
        />

        {/* GPS 로딩 배너 */}
        {gpsLoading && (
          <div className="absolute left-0 right-0 top-3 flex justify-center pointer-events-none">
            <div className="rounded-xl bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
              📡 위치 확인 중...
            </div>
          </div>
        )}

        {/* 정확도 표시 */}
        {lat && lng && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <div className="rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur">
              내 위치 ✅
            </div>
          </div>
        )}

        {/* 점수판 버튼 */}
        <button
          onClick={() => router.push(`/join/${roomId}/score`)}
          className="absolute top-3 left-3 rounded-xl bg-white px-3 py-2 text-sm font-medium shadow"
        >
          🏆 점수판
        </button>

        {/* 획득 결과 토스트 */}
        {resultMsg && (
          <div className="absolute left-4 right-4 bottom-36 flex justify-center pointer-events-none">
            <div className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur ${
              resultMsg.startsWith('🎉') ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {resultMsg}
            </div>
          </div>
        )}
      </div>

      {/* 하단 — 아이템 획득 패널 */}
      <div className="bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        {nearbyItem ? (
          <div className="flex items-center gap-3">
            <div className="text-4xl">{ITEM_IMAGES[nearbyItem.image_key as ItemImageKey] ?? '📍'}</div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{nearbyItem.name}</p>
              <p className="text-sm text-gray-400">
                {nearbyItem.score}점
                {nearbyItem.max_winners && ` · 남은 수량 ${nearbyItem.max_winners - nearbyItem.collected_count}`}
                {nearbyItem.distanceM !== null && ` · ${Math.round(nearbyItem.distanceM)}m`}
              </p>
            </div>
            <button
              onClick={() => lat && lng && collect(nearbyItem.id, lat, lng)}
              disabled={collecting || !lat}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {collecting ? '획득 중...' : '획득하기'}
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-400 py-2">
            {gameItems.filter((i) => !i.isCollected && !i.isSoldOut).length === 0
              ? '🎊 모든 아이템을 획득했어요!'
              : gameItems.some((i) => i.isRevealed && !i.isCollected && !i.isSoldOut)
                ? '아이템을 발견했어요! 더 가까이 가세요'
                : '이벤트 구역을 돌아다니며 아이템을 찾아보세요 🔍'}
          </div>
        )}
      </div>
    </main>
  )
}
