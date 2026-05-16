'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
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
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [])

  const nearbyItem = gameItems.find((i) => i.isNearby && !i.isCollected && !i.isSoldOut)
  const closestRevealed = gameItems
    .filter((i) => i.isRevealed && !i.isCollected && !i.isSoldOut && i.distanceM !== null)
    .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0))[0]
  const allDone = gameItems.length > 0 && gameItems.filter((i) => !i.isCollected && !i.isSoldOut).length === 0
  const resultMsg = getResultMessage()
  const remainingCount = gameItems.filter((i) => !i.isCollected && !i.isSoldOut).length

  async function handleCollect() {
    if (!lat || !lng || !nearbyItem) return
    setShowConfirm(false)
    await collect(nearbyItem.id, lat, lng)
  }

  // 카메라 권한 거부
  if (cameraError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center gap-5">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 40 }}>no_photography</span>
        </div>
        <div>
          <h1 className="font-headline text-lg font-bold text-error">카메라 권한 필요</h1>
          <p className="mt-1 text-sm text-on-surface-variant">카메라를 허용해야 AR 보물찾기를 즐길 수 있습니다</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="h-12 bg-primary text-on-primary px-8 rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black">
      {/* 카메라 피드 */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />

      {/* 카메라 시작 전 로딩 */}
      {!cameraReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
          <span className="material-symbols-outlined text-on-surface-variant text-4xl animate-pulse">camera_alt</span>
          <p className="mt-2 text-sm text-on-surface-variant animate-pulse">카메라 시작 중...</p>
        </div>
      )}

      {/* ── 상단 헤더 ── */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-headline text-xl font-extrabold text-primary tracking-tighter">SpotHunt</span>
          <span className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest ml-1">
            AR 사냥
          </span>
        </div>
        <button
          onClick={() => router.push(`/join/${roomId}/score`)}
          className="glass-hud px-3 py-1 rounded-full text-xs font-semibold text-on-surface flex items-center gap-1"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>military_tech</span>
          점수판
        </button>
      </header>

      {/* ── 상단 HUD 패널 ── */}
      <div className="absolute top-14 left-5 right-5 z-40 flex gap-3">
        <div className="glass-hud flex-1 rounded-xl p-3 flex items-center gap-2">
          <div className="bg-tertiary-container/30 p-1.5 rounded-lg">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>
              {gpsLoading ? 'gps_not_fixed' : gpsError ? 'gps_off' : 'gps_fixed'}
            </span>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">위치</p>
            <p className="text-sm font-bold text-on-surface leading-none">
              {gpsLoading ? '확인 중...' : gpsError ? '오류' : '연결됨'}
            </p>
          </div>
        </div>
        <div className="glass-hud flex-1 rounded-xl p-3 flex items-center gap-2">
          <div className="bg-primary-container/30 p-1.5 rounded-lg">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>explore</span>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">남은 아이템</p>
            <p className="text-sm font-bold text-on-surface leading-none">{remainingCount}개</p>
          </div>
        </div>
      </div>

      {/* ── AR 오버레이: 근처 아이템 발견 ── */}
      {nearbyItem && !showConfirm && (
        <button
          className="absolute inset-0 z-30 flex flex-col items-center justify-center"
          onClick={() => setShowConfirm(true)}
        >
          <div className="absolute inset-0 bg-primary/10" />
          <div className="relative z-10 mx-8 glass-hud rounded-3xl px-8 py-10 text-center border-2 border-primary/30">
            <div className="text-8xl mb-4" style={{ animation: 'arBounce 1.2s ease-in-out infinite' }}>
              {ITEM_IMAGES[nearbyItem.image_key as ItemImageKey] ?? '📍'}
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">{nearbyItem.name}</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {nearbyItem.score}점
              {nearbyItem.max_winners != null && ` · 남은 수량 ${nearbyItem.max_winners - nearbyItem.collected_count}`}
            </p>
            <div className="mt-6 rounded-xl bg-primary/80 px-5 py-2.5">
              <p className="text-on-primary text-sm font-bold animate-pulse">탭해서 획득하기 ✨</p>
            </div>
          </div>
        </button>
      )}

      {/* ── 획득 확인 팝업 ── */}
      {nearbyItem && showConfirm && (
        <div className="absolute inset-0 z-40 bg-surface/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-hud w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl border-2 border-primary/30 flex flex-col gap-4">
            <div className="w-24 h-24 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto border-4 border-tertiary">
              <span className="text-5xl">{ITEM_IMAGES[nearbyItem.image_key as ItemImageKey] ?? '📍'}</span>
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface">보물을 발견했어요!</h2>
              <p className="text-sm font-bold text-on-surface mt-1">{nearbyItem.name}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{nearbyItem.score}점</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold active:scale-95 transition-transform"
              >
                취소
              </button>
              <button
                onClick={handleCollect}
                disabled={collecting || !lat}
                className="flex-1 h-12 bg-primary text-on-primary rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 font-headline"
              >
                {collecting ? '획득 중...' : 'COLLECT NOW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 하단 상태 / 액션 ── */}
      {!nearbyItem && !showConfirm && (
        <div className="absolute bottom-20 left-5 right-5 z-40 flex flex-col gap-3 items-center">
          {closestRevealed && !allDone && (
            <div className="glass-hud px-4 py-2 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
              <p className="text-xs font-semibold text-on-surface-variant">
                아이템 감지:{' '}
                <span className="text-tertiary font-bold">{Math.round(closestRevealed.distanceM ?? 0)}m</span>
              </p>
            </div>
          )}

          {allDone ? (
            <div className="glass-hud w-full rounded-2xl px-5 py-4 text-center">
              <p className="font-headline text-on-surface font-bold">🎊 모든 아이템을 획득했어요!</p>
            </div>
          ) : (
            <div className="glass-hud w-full px-4 py-3 rounded-2xl text-center">
              <p className="text-sm text-on-surface-variant">
                {gpsLoading
                  ? '📡 위치를 확인 중이에요...'
                  : closestRevealed
                  ? `📍 ${closestRevealed.name} — 더 가까이 가세요`
                  : '이벤트 구역을 탐험하며 아이템을 찾아보세요 🔍'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 결과 토스트 ── */}
      {resultMsg && (
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 z-50 flex justify-center pointer-events-none">
          <div className={`glass-hud rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl ${
            resultMsg.startsWith('🎉') ? 'border border-tertiary' : 'border border-error'
          }`}>
            <span className="material-symbols-outlined text-tertiary">stars</span>
            <p className="text-sm font-bold text-on-surface">{resultMsg}</p>
          </div>
        </div>
      )}

      {/* ── 우측 플로팅 컨트롤 ── */}
      <div className="absolute right-4 bottom-24 z-40 flex flex-col gap-2">
        <button className="w-11 h-11 glass-hud rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>my_location</span>
        </button>
      </div>

      {/* ── 하단 네비게이션 ── */}
      <nav className="absolute bottom-0 w-full z-50 flex justify-around items-center px-5 pb-2 h-16 bg-surface-container/90 backdrop-blur-lg border-t border-white/10 rounded-t-xl">
        <div className="flex flex-col items-center justify-center text-primary font-bold border-t-2 border-primary pt-2">
          <span className="material-symbols-outlined">map</span>
          <span className="text-[11px] font-semibold">지도</span>
        </div>
        <button
          onClick={() => router.push(`/join/${roomId}/score`)}
          className="flex flex-col items-center justify-center text-on-surface-variant pt-2"
        >
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[11px] font-semibold">점수판</span>
        </button>
        <Link
          href={`/join/${roomId}/lobby`}
          className="flex flex-col items-center justify-center text-on-surface-variant pt-2"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[11px] font-semibold">로비</span>
        </Link>
      </nav>

      <style>{`
        @keyframes arBounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
      `}</style>
    </main>
  )
}
