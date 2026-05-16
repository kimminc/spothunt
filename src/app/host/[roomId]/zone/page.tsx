'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useZone } from '@/features/host/useZone'

const KakaoMap = dynamic(() => import('@/components/map/kakao-map'), { ssr: false })

export default function ZonePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { center, radius, setRadius, saving, error, handleMapClick, useCurrentLocation, saveZone } = useZone(roomId)

  return (
    <main className="flex h-screen flex-col bg-knear">
      {/* 지도 */}
      <div className="relative flex-1 min-h-0">
        <KakaoMap
          center={center ?? { lat: 37.5665, lng: 126.978 }}
          zoom={4}
          pin={center}
          zone={center ? { lat: center.lat, lng: center.lng, radiusM: radius } : null}
          onClick={handleMapClick}
          className="h-full w-full"
        />

        {/* 안내 배너 */}
        <div className="absolute left-0 right-0 top-3 flex justify-center px-4 pointer-events-none">
          <div className="rounded-xl bg-knear/75 px-4 py-2 text-sm text-white backdrop-blur">
            {center ? '📍 중심 위치가 설정됐어요' : '지도를 탭해서 이벤트 중심 위치를 선택하세요'}
          </div>
        </div>

        {/* 내 위치 버튼 */}
        <button
          onClick={useCurrentLocation}
          className="absolute bottom-4 right-4 rounded-full bg-white p-3 shadow-kraken text-lg transition-transform hover:scale-105"
          title="현재 위치로"
        >
          📡
        </button>
      </div>

      {/* 하단 패널 */}
      <div className="rounded-t-3xl bg-white px-5 pt-5 pb-8 shadow-kraken-up space-y-4 border-t border-kgray-border">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-knear">이벤트 반경</label>
            <span className="text-sm font-bold text-kp">{radius}m</span>
          </div>
          <input
            type="range" min={50} max={1000} step={50}
            value={radius} onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-[#7132f5]"
          />
          <div className="mt-1 flex justify-between text-xs text-kgray-light">
            <span>50m</span><span>1000m</span>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={saveZone}
          disabled={!center || saving}
          className="w-full rounded-xl bg-kp py-[13px] text-base font-semibold text-white transition-colors hover:bg-kp-dark disabled:opacity-40"
        >
          {saving ? '저장 중...' : '저장하고 아이템 등록 →'}
        </button>
      </div>
    </main>
  )
}
