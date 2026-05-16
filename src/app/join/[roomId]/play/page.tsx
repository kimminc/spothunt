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

  const markers = gameItems
    .filter((item) => item.isRevealed)
    .map((item) => ({
      lat: item.latitude,
      lng: item.longitude,
      emoji: ITEM_IMAGES[item.image_key as ItemImageKey] ?? '📍',
      dimmed: item.isCollected || item.isSoldOut,
    }))

  const nearbyItem = gameItems.find((i) => i.isNearby && !i.isCollected && !i.isSoldOut)
  const resultMsg = getResultMessage()

  if (gpsError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center gap-5">
        <div className="text-5xl">📡</div>
        <div>
          <h1 className="text-lg font-bold text-red-500">위치 권한 필요</h1>
          <p className="mt-1 text-sm text-kgray-light">{gpsError}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-kp px-6 py-[13px] text-sm font-semibold text-white transition-colors hover:bg-kp-dark"
        >
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
            <div className="rounded-xl bg-knear/80 px-4 py-2 text-sm text-white backdrop-blur">
              📡 위치 확인 중...
            </div>
          </div>
        )}

        {/* 내 위치 표시 */}
        {lat && lng && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <div className="rounded-xl bg-knear/60 px-2.5 py-1.5 text-xs text-white backdrop-blur">
              내 위치 ✅
            </div>
          </div>
        )}

        {/* 점수판 버튼 */}
        <button
          onClick={() => router.push(`/join/${roomId}/score`)}
          className="absolute top-3 left-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-knear shadow-kraken border border-kgray-border transition-colors hover:bg-kgray-bg"
        >
          🏆 점수판
        </button>

        {/* 획득 결과 토스트 */}
        {resultMsg && (
          <div className="absolute left-4 right-4 bottom-36 flex justify-center pointer-events-none">
            <div className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-kraken backdrop-blur ${
              resultMsg.startsWith('🎉') ? 'bg-kgreen' : 'bg-red-500'
            }`}>
              {resultMsg}
            </div>
          </div>
        )}
      </div>

      {/* 하단 아이템 획득 패널 */}
      <div className="bg-white px-4 py-4 shadow-kraken-up border-t border-kgray-border">
        {nearbyItem ? (
          <div className="flex items-center gap-3">
            <div className="text-4xl">{ITEM_IMAGES[nearbyItem.image_key as ItemImageKey] ?? '📍'}</div>
            <div className="flex-1">
              <p className="font-bold text-knear">{nearbyItem.name}</p>
              <p className="text-sm text-kgray-light">
                {nearbyItem.score}점
                {nearbyItem.max_winners && ` · 남은 수량 ${nearbyItem.max_winners - nearbyItem.collected_count}`}
                {nearbyItem.distanceM !== null && ` · ${Math.round(nearbyItem.distanceM)}m`}
              </p>
            </div>
            <button
              onClick={() => lat && lng && collect(nearbyItem.id, lat, lng)}
              disabled={collecting || !lat}
              className="rounded-xl bg-kp px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-kp-dark disabled:opacity-50"
            >
              {collecting ? '획득 중...' : '획득하기'}
            </button>
          </div>
        ) : (
          <div className="py-2 text-center text-sm text-kgray-light">
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
