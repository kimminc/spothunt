'use client'

import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useRoomItems } from '@/features/host/useRoomItems'
import { ITEM_IMAGES, type ItemImageKey } from '@/types'

const KakaoMap = dynamic(() => import('@/components/map/kakao-map'), { ssr: false })

// 반경 크기에 맞는 카카오맵 줌 레벨
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

  const zone = room ? { lat: room.center_lat, lng: room.center_lng, radiusM: room.boundary_radius_meter } : null
  const mapCenter = room && room.center_lat !== 0
    ? { lat: room.center_lat, lng: room.center_lng }
    : { lat: 37.5665, lng: 126.978 }
  const zoom = room ? zoomForRadius(room.boundary_radius_meter) : 4

  const markers = items.map((item) => ({
    lat: item.latitude,
    lng: item.longitude,
    emoji: ITEM_IMAGES[item.image_key as ItemImageKey] ?? '📍',
  }))

  const canGoLobby = items.length > 0

  return (
    <main className="flex h-screen flex-col bg-gray-900">

      {/* ── 지도 ── */}
      <div className="relative flex-1 min-h-0">
        <KakaoMap
          center={mapCenter}
          zoom={zoom}
          markers={markers}
          zone={zone}
          onClick={(lat, lng) => !showForm && openFormAt(lat, lng)}
          className="h-full w-full"
        />

        {/* 안내 배너 */}
        <div className="absolute left-0 right-0 top-3 flex justify-center px-4 pointer-events-none">
          <div className="rounded-xl bg-black/65 px-4 py-2 text-sm text-white backdrop-blur">
            {items.length === 0
              ? '파란 원 안의 지도를 탭해서 아이템을 추가하세요'
              : `아이템 ${items.length}개 등록됨 · 추가하려면 지도를 탭`}
          </div>
        </div>
      </div>

      {/* ── 아이템 등록 폼 오버레이 ── */}
      {showForm && (
        <div className="absolute inset-0 z-20 flex items-end bg-black/50" onClick={closeForm}>
          <div
            className="w-full rounded-t-3xl bg-white px-5 pt-5 pb-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">아이템 추가</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* 이모지 선택 */}
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">이미지</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(ITEM_IMAGES) as [ItemImageKey, string][]).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => setForm((f) => ({ ...f, imageKey: key }))}
                    className={`rounded-2xl p-2.5 text-2xl border-2 transition-all ${
                      form.imageKey === key
                        ? 'border-indigo-500 bg-indigo-50 scale-110'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">아이템 이름 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 황금 보물상자"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">점수</label>
                <input
                  type="number" min={1} value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">획득 반경 (m)</label>
                <input
                  type="number" min={5} max={200} value={form.pickupRadius}
                  onChange={(e) => setForm((f) => ({ ...f, pickupRadius: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {room?.mode === 'COMPETITION' && (
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">최대 획득 인원</label>
                  <input
                    type="number" min={1}
                    value={form.maxWinners ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, maxWinners: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="비워두면 무제한"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>
            )}

            <button
              onClick={addItem} disabled={saving || !form.name.trim()}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow disabled:opacity-40 hover:bg-indigo-700 active:bg-indigo-800"
            >
              {saving ? '저장 중...' : `${ITEM_IMAGES[form.imageKey]} 추가하기`}
            </button>
          </div>
        </div>
      )}

      {/* ── 하단 패널: 아이템 목록 + 이동 버튼 ── */}
      <div className="rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">

        {/* 아이템 목록 (최대 3개 높이, 스크롤) */}
        <div className="max-h-52 overflow-y-auto px-4 pt-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-4 text-center">
              <span className="text-3xl">📦</span>
              <p className="text-sm font-medium text-gray-400">아이템이 없습니다</p>
              <p className="text-xs text-gray-300">지도를 탭해서 아이템을 추가하세요</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 hover:bg-gray-100 transition-colors"
                >
                  {/* 순번 */}
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {i + 1}
                  </span>
                  {/* 이모지 */}
                  <span className="text-2xl leading-none">{ITEM_IMAGES[item.image_key as ItemImageKey] ?? '📍'}</span>
                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">{item.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                        +{item.score}점
                      </span>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                        반경 {item.pickup_radius_meter}m
                      </span>
                      {item.max_winners && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                          선착순 {item.max_winners}명
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 삭제 */}
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="flex-shrink-0 rounded-xl p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 대기방 버튼 */}
        <div className="px-4 pb-5 pt-3">
          {!canGoLobby && (
            <p className="mb-2 text-center text-xs text-amber-600 font-medium">
              아이템을 1개 이상 추가해야 대기방으로 이동할 수 있습니다
            </p>
          )}
          <button
            onClick={() => router.push(`/host/${roomId}/lobby`)}
            disabled={!canGoLobby}
            className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            {canGoLobby ? `대기방으로 이동 (${items.length}개 등록됨) →` : '아이템을 추가하세요'}
          </button>
        </div>
      </div>

    </main>
  )
}
