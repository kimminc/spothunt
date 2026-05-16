'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGeolocation } from '@/features/shared/useGeolocation'
import { useGameMap } from '@/features/player/useGameMap'
import { useCollectItem } from '@/features/player/useCollectItem'
import { supabase } from '@/lib/supabase'
import { ITEM_IMAGES, type ItemImageKey } from '@/types'

export default function PlayPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const { lat, lng, error: gpsError, loading: gpsLoading } = useGeolocation()
  const { gameItems } = useGameMap(roomId, lat, lng)
  const { collect, collecting, getResultMessage } = useCollectItem()

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // 이벤트 종료 감지 → 점수판으로 이동
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

  // 카메라 초기화 (후면 카메라 우선)
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().then(() => setCameraReady(true))
        }
      })
      .catch(() => setCameraError(true))

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const nearbyItem = gameItems.find((i) => i.isNearby && !i.isCollected && !i.isSoldOut)
  const closestRevealed = gameItems
    .filter((i) => i.isRevealed && !i.isCollected && !i.isSoldOut && i.distanceM !== null)
    .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0))[0]
  const allDone = gameItems.length > 0 && gameItems.filter((i) => !i.isCollected && !i.isSoldOut).length === 0
  const resultMsg = getResultMessage()

  async function handleCollect() {
    if (!lat || !lng || !nearbyItem) return
    setShowConfirm(false)
    await collect(nearbyItem.id, lat, lng)
  }

  // 카메라 권한 거부
  if (cameraError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center gap-5">
        <div className="text-5xl">📷</div>
        <div>
          <h1 className="text-lg font-bold text-red-500">카메라 권한 필요</h1>
          <p className="mt-1 text-sm text-kgray-light">카메라를 허용해야 AR 보물찾기를 즐길 수 있습니다</p>
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
    <main className="relative h-screen overflow-hidden bg-black">

      {/* 카메라 피드 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* 카메라 시작 전 로딩 */}
      {!cameraReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
          <p className="text-white/60 text-sm animate-pulse">카메라 시작 중...</p>
        </div>
      )}

      {/* ── 상단 HUD ── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        {/* 점수판 */}
        <button
          onClick={() => router.push(`/join/${roomId}/score`)}
          className="rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-knear shadow-kraken backdrop-blur transition-colors hover:bg-white"
        >
          🏆 점수판
        </button>

        {/* GPS 상태 */}
        {gpsLoading && (
          <div className="rounded-xl bg-knear/70 px-3 py-2 text-xs text-white backdrop-blur">
            📡 위치 확인 중...
          </div>
        )}
        {gpsError && (
          <div className="rounded-xl bg-red-500/80 px-3 py-2 text-xs text-white backdrop-blur">
            📡 위치 오류
          </div>
        )}
        {!gpsLoading && !gpsError && lat && (
          <div className="rounded-xl bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur">
            ✅ 위치 연결됨
          </div>
        )}
      </div>

      {/* ── 하단 상태 메시지 ── */}
      {!nearbyItem && !showConfirm && (
        <div className="absolute bottom-8 left-4 right-4 z-20">
          {allDone ? (
            <div className="rounded-2xl bg-black/60 px-5 py-4 text-center backdrop-blur">
              <p className="text-white font-semibold">🎊 모든 아이템을 획득했어요!</p>
            </div>
          ) : closestRevealed ? (
            <div className="rounded-2xl bg-black/60 px-5 py-4 text-center backdrop-blur">
              <p className="text-2xl mb-1">
                {ITEM_IMAGES[closestRevealed.image_key as ItemImageKey] ?? '📍'}
              </p>
              <p className="text-white text-sm font-semibold">{closestRevealed.name} 발견!</p>
              <p className="text-white/60 text-xs mt-0.5">
                더 가까이 가세요 · {Math.round(closestRevealed.distanceM ?? 0)}m 남음
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-black/60 px-5 py-4 text-center backdrop-blur">
              <p className="text-white/80 text-sm">이벤트 구역을 돌아다니며 아이템을 찾아보세요 🔍</p>
            </div>
          )}
        </div>
      )}

      {/* ── AR 오버레이 — 픽업 반경 안에 아이템 발견 ── */}
      {nearbyItem && !showConfirm && (
        <button
          className="absolute inset-0 z-30 flex flex-col items-center justify-center"
          onClick={() => setShowConfirm(true)}
        >
          {/* 은은한 보라 틴트 */}
          <div className="absolute inset-0 bg-kp/15" />

          {/* 아이템 카드 */}
          <div className="relative z-10 mx-8 rounded-3xl bg-black/55 px-8 py-10 text-center backdrop-blur-sm border border-white/10">
            <div
              className="text-8xl mb-4"
              style={{ animation: 'arBounce 1.2s ease-in-out infinite' }}
            >
              {ITEM_IMAGES[nearbyItem.image_key as ItemImageKey] ?? '📍'}
            </div>
            <h2 className="text-white text-xl font-bold">{nearbyItem.name}</h2>
            <p className="text-white/60 text-sm mt-1">
              {nearbyItem.score}점
              {nearbyItem.max_winners != null && ` · 남은 수량 ${nearbyItem.max_winners - nearbyItem.collected_count}`}
            </p>
            <div className="mt-6 rounded-xl bg-kp/80 px-5 py-2.5 backdrop-blur">
              <p className="text-white text-sm font-semibold animate-pulse">탭해서 획득하기 ✨</p>
            </div>
          </div>
        </button>
      )}

      {/* ── 획득 확인 다이얼로그 ── */}
      {nearbyItem && showConfirm && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="mx-5 w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-kraken">
            <div className="text-7xl mb-4">
              {ITEM_IMAGES[nearbyItem.image_key as ItemImageKey] ?? '📍'}
            </div>
            <h2
              className="font-display text-xl font-bold text-knear"
              style={{ letterSpacing: '-0.5px' }}
            >
              {nearbyItem.name}
            </h2>
            <p className="mt-1 text-sm text-kgray-light">{nearbyItem.score}점</p>

            <p className="mt-5 text-base font-medium text-knear">획득하시겠습니까?</p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-kgray-border py-3 text-sm font-semibold text-kgray transition-colors hover:bg-kgray-bg"
              >
                취소
              </button>
              <button
                onClick={handleCollect}
                disabled={collecting || !lat}
                className="flex-1 rounded-xl bg-kp py-3 text-sm font-bold text-white transition-colors hover:bg-kp-dark disabled:opacity-50"
              >
                {collecting ? '획득 중...' : '획득'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 획득 결과 토스트 ── */}
      {resultMsg && (
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 z-50 flex justify-center pointer-events-none">
          <div className={`rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-kraken backdrop-blur ${
            resultMsg.startsWith('🎉') ? 'bg-kgreen' : 'bg-red-500'
          }`}>
            {resultMsg}
          </div>
        </div>
      )}

      <style>{`
        @keyframes arBounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
      `}</style>
    </main>
  )
}
