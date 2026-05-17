'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useZone } from '@/features/host/useZone'

const KakaoMap = dynamic(() => import('@/components/map/kakao-map'), { ssr: false })

const SEOUL = { lat: 37.5665, lng: 126.978 }

export default function ZonePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { center, radius, setRadius, saving, error, gpsLoading, handleMapClick, useCurrentLocation, saveZone } = useZone(roomId)

  return (
    <main className="flex h-screen flex-col bg-background">
      {/* 지도 */}
      <div className="relative flex-1 min-h-0">
        <KakaoMap
          center={center ?? SEOUL}
          zoom={4}
          pin={center}
          zone={center ? { lat: center.lat, lng: center.lng, radiusM: radius } : null}
          onClick={handleMapClick}
          className="h-full w-full"
        />

        {/* GPS 로딩 오버레이 */}
        {gpsLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <span className="material-symbols-outlined text-on-surface-variant text-5xl animate-pulse">gps_not_fixed</span>
            <p className="text-on-surface text-sm font-medium mt-3">현재 위치를 가져오는 중...</p>
          </div>
        )}

        {/* 안내 배너 */}
        {!gpsLoading && (
          <div className="absolute left-0 right-0 top-3 flex justify-center px-4 pointer-events-none z-10">
            <div className="glass-hud rounded-full px-4 py-2 text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>
                {center ? 'location_on' : 'touch_app'}
              </span>
              {center ? '📍 중심 위치가 설정됐어요' : '지도를 탭해서 이벤트 중심 위치를 선택하세요'}
            </div>
          </div>
        )}

        {/* 내 위치 버튼 */}
        <button
          onClick={useCurrentLocation}
          className="absolute bottom-4 right-4 w-12 h-12 glass-hud rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors z-10 shadow-lg"
          title="현재 위치로"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {/* 하단 패널 */}
      <div className="bg-surface border-t border-white/10 px-5 pt-5 pb-8 space-y-4 shadow-[0_-4px_32px_rgba(0,0,0,0.4)]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>radar</span>
              이벤트 반경
            </label>
            <span className="font-headline text-lg font-bold text-primary">{radius}m</span>
          </div>
          <input
            type="range" min={50} max={1000} step={50}
            value={radius} onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#ffb77d' }}
          />
          <div className="mt-1.5 flex justify-between text-xs text-on-surface-variant">
            <span>50m</span><span>1000m</span>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-error-container/50 px-3 py-2.5 text-sm text-on-error-container border border-error/20">{error}</p>
        )}

        <button
          onClick={saveZone}
          disabled={!center || saving}
          className="w-full h-12 bg-primary text-on-primary font-headline text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg disabled:opacity-40"
        >
          <span className="material-symbols-outlined">{saving ? 'hourglass_top' : 'arrow_forward'}</span>
          {saving ? '저장 중...' : '저장하고 아이템 등록'}
        </button>
      </div>
    </main>
  )
}
