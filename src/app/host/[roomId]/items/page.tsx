'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoomItems } from '@/features/host/useRoomItems'
import { ITEM_IMAGES, type ItemImageKey } from '@/types'

const KakaoMap = dynamic(() => import('@/components/map/kakao-map'), { ssr: false })

function zoomForRadius(r: number) {
  if (r <= 100) return 3
  if (r <= 300) return 4
  if (r <= 700) return 5
  return 6
}

export default function ItemsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const { room, items, form, setForm, showForm, saving, error, openFormAt, closeForm, addItem, deleteItem } = useRoomItems(roomId)
  const [listExpanded, setListExpanded] = useState(false)
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  const zone = room ? { lat: room.center_lat, lng: room.center_lng, radiusM: room.boundary_radius_meter } : null
  const mapCenter = myLocation ?? (room && room.center_lat !== 0
    ? { lat: room.center_lat, lng: room.center_lng }
    : { lat: 37.5665, lng: 126.978 })
  const zoom = room ? zoomForRadius(room.boundary_radius_meter) : 4
  const markers = items.map((item) => ({
    lat: item.latitude, lng: item.longitude,
    emoji: ITEM_IMAGES[item.image_key as ItemImageKey] ?? '📍',
  }))
  const canGoLobby = items.length > 0
  const totalScore = items.reduce((s, i) => s + i.score, 0)

  return (
    <main className="relative h-screen overflow-hidden bg-background">
      {/* 지도 */}
      <div className="absolute inset-0">
        <KakaoMap
          center={mapCenter}
          zoom={zoom}
          markers={markers}
          zone={zone}
          myLocation={myLocation}
          onClick={(lat, lng) => !showForm && openFormAt(lat, lng)}
          className="h-full w-full"
        />
      </div>

      {/* 상단 안내 배너 */}
      <div className="absolute left-0 right-0 top-3 flex justify-center px-4 pointer-events-none z-10">
        <div className="glass-hud rounded-full px-4 py-2 text-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>
            {items.length === 0 ? 'add_location' : 'location_on'}
          </span>
          {items.length === 0 ? '구역 안을 탭해서 아이템 추가' : `${items.length}개 등록 · 탭해서 추가`}
        </div>
      </div>

      {/* 하단 패널 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 rounded-t-3xl bg-surface border-t border-white/10 shadow-[0_-4px_32px_rgba(0,0,0,0.5)]">
        {/* 핸들 */}
        <button
          className="flex w-full items-center justify-between px-5 py-4"
          onClick={() => setListExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <span className="font-headline text-base font-bold text-on-surface">
              {items.length === 0 ? '아이템 없음' : `아이템 ${items.length}개`}
            </span>
            {items.length > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                {totalScore}점 총합
              </span>
            )}
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">
            {listExpanded ? 'expand_more' : 'expand_less'}
          </span>
        </button>

        {/* 아이템 목록 */}
        {listExpanded && (
          <div className="max-h-56 overflow-y-auto px-4 pb-2">
            {items.length === 0 ? (
              <p className="py-4 text-center text-sm text-on-surface-variant">지도를 탭해서 아이템을 추가하세요</p>
            ) : (
              <ul className="space-y-2 pb-2">
                {items.map((item, i) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-xl bg-surface-container px-3 py-2.5">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">{i + 1}</span>
                    <span className="text-2xl leading-none">{ITEM_IMAGES[item.image_key as ItemImageKey] ?? '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-on-surface">{item.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">+{item.score}점</span>
                        <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs text-on-surface-variant">{item.pickup_radius_meter}m</span>
                        {item.max_winners && (
                          <span className="rounded-full bg-tertiary/20 px-2 py-0.5 text-xs text-tertiary">선착순 {item.max_winners}명</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex-shrink-0 p-1.5 text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 대기방 버튼 */}
        <div className="px-4 pb-8 pt-2">
          {!canGoLobby && (
            <p className="mb-2 text-center text-xs font-medium text-tertiary flex items-center justify-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
              아이템을 1개 이상 추가해야 이동할 수 있습니다
            </p>
          )}
          <button
            onClick={() => router.push(`/host/${roomId}/lobby`)}
            disabled={!canGoLobby}
            className="w-full h-12 bg-primary text-on-primary font-headline text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">{canGoLobby ? 'arrow_forward' : 'lock'}</span>
            {canGoLobby ? '대기방으로 이동' : '아이템을 추가하세요'}
          </button>
        </div>
      </div>

      {/* 아이템 등록 폼 오버레이 */}
      {showForm && (
        <div
          className="absolute inset-0 z-20 flex items-end bg-background/60 backdrop-blur-sm"
          onClick={closeForm}
        >
          <div
            className="w-full rounded-t-3xl bg-surface px-5 pt-5 pb-10 space-y-4 border-t border-white/10 shadow-[0_-4px_32px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-base font-bold text-on-surface">아이템 추가</h2>
              <button
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            {/* Image selection */}
            <div>
              <p className="mb-2 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">이미지 선택</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(ITEM_IMAGES) as [ItemImageKey, string][]).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => setForm((f) => ({ ...f, imageKey: key }))}
                    className={`rounded-xl p-2.5 text-2xl border-2 transition-all ${
                      form.imageKey === key
                        ? 'border-primary bg-primary/15 scale-110'
                        : 'border-outline-variant bg-surface-container'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1.5 block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">아이템 이름 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 황금 보물상자"
                  className="w-full h-11 bg-surface-container border border-outline-variant rounded-xl px-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">점수</label>
                <input
                  type="number" min={1} value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
                  className="w-full h-11 bg-surface-container border border-outline-variant rounded-xl px-3 text-sm text-on-surface outline-none transition focus:border-tertiary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">획득 반경 (m)</label>
                <input
                  type="number" min={5} max={200} value={form.pickupRadius}
                  onChange={(e) => setForm((f) => ({ ...f, pickupRadius: Number(e.target.value) }))}
                  className="w-full h-11 bg-surface-container border border-outline-variant rounded-xl px-3 text-sm text-on-surface outline-none transition focus:border-tertiary"
                />
              </div>
              {room?.mode === 'COMPETITION' && (
                <div className="col-span-2">
                  <label className="mb-1.5 block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">최대 획득 인원 (선착순)</label>
                  <input
                    type="number" min={1} value={form.maxWinners ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, maxWinners: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="비워두면 무제한"
                    className="w-full h-11 bg-surface-container border border-outline-variant rounded-xl px-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition focus:border-tertiary"
                  />
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-xl bg-error-container/50 px-3 py-2.5 text-sm text-on-error-container border border-error/20">{error}</p>
            )}

            <button
              onClick={addItem}
              disabled={saving || !form.name.trim()}
              className="w-full h-12 bg-primary text-on-primary font-headline text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-40"
            >
              {saving ? '저장 중...' : `${ITEM_IMAGES[form.imageKey]} 추가하기`}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
