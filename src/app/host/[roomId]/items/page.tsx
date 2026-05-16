'use client'

import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useRoomItems } from '@/features/host/useRoomItems'
import { ITEM_IMAGES, type ItemImageKey } from '@/types'

const KakaoMap = dynamic(() => import('@/components/map/kakao-map'), { ssr: false })

export default function ItemsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const { room, items, form, setForm, showForm, saving, error, openFormAt, closeForm, addItem, deleteItem } = useRoomItems(roomId)

  const zone = room ? { lat: room.center_lat, lng: room.center_lng, radiusM: room.boundary_radius_meter } : null
  const mapCenter = room && room.center_lat !== 0 ? { lat: room.center_lat, lng: room.center_lng } : { lat: 37.5665, lng: 126.978 }

  const markers = items.map((item) => ({
    lat: item.latitude,
    lng: item.longitude,
    emoji: ITEM_IMAGES[item.image_key as ItemImageKey] ?? '📍',
  }))

  return (
    <main className="flex h-screen flex-col bg-gray-900">
      {/* 지도 — min-h-0: flex 컨테이너에서 h-full 동작 */}
      <div className="relative flex-1 min-h-0">
        <KakaoMap
          center={mapCenter}
          zoom={4}
          markers={markers}
          zone={zone}
          onClick={(lat, lng) => !showForm && openFormAt(lat, lng)}
          className="h-full w-full"
        />

        <div className="absolute left-0 right-0 top-3 flex justify-center px-4 pointer-events-none">
          <div className="rounded-xl bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
            지도를 탭해서 아이템 위치를 선택하세요 ({items.length}개 등록됨)
          </div>
        </div>
      </div>

      {/* 아이템 등록 폼 (지도 클릭 시 표시) */}
      {showForm && (
        <div className="absolute inset-0 flex items-end bg-black/40 z-10" onClick={closeForm}>
          <div className="w-full rounded-t-3xl bg-white p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">아이템 추가</h2>
              <button onClick={closeForm} className="text-gray-400 text-xl">✕</button>
            </div>

            {/* 이모지 선택 */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">이미지 선택</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(ITEM_IMAGES) as [ItemImageKey, string][]).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => setForm((f) => ({ ...f, imageKey: key }))}
                    className={`rounded-xl p-2 text-2xl border-2 ${form.imageKey === key ? 'border-indigo-500 bg-indigo-50' : 'border-transparent'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">아이템 이름 *</label>
                <input
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 황금 보물상자"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">점수</label>
                <input
                  type="number" min={1} value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">획득 반경 (m)</label>
                <input
                  type="number" min={5} max={200} value={form.pickupRadius}
                  onChange={(e) => setForm((f) => ({ ...f, pickupRadius: Number(e.target.value) }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              {room?.mode === 'COMPETITION' && (
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">최대 획득 인원 (경쟁형)</label>
                  <input
                    type="number" min={1}
                    value={form.maxWinners ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, maxWinners: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="비워두면 무제한"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={addItem} disabled={saving}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? '저장 중...' : '아이템 추가'}
            </button>
          </div>
        </div>
      )}

      {/* 하단 패널 — 등록된 아이템 목록 */}
      <div className="max-h-48 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-lg">
        {items.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-2">지도를 탭해서 첫 번째 아이템을 추가하세요</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                <span className="text-lg">{ITEM_IMAGES[item.image_key as ItemImageKey] ?? '📍'}</span>
                <div className="flex-1 ml-2">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.score}점 · 반경 {item.pickup_radius_meter}m</p>
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-red-300 hover:text-red-500 px-2">🗑️</button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => router.push(`/host/${roomId}/lobby`)}
          className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          대기방으로 이동 →
        </button>
      </div>
    </main>
  )
}
