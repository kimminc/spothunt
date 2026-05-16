'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchRooms } from '@/features/player/useJoinRoom'

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  WAITING:   { text: '대기중',  color: 'bg-green-100 text-green-700' },
  RUNNING:   { text: '진행중',  color: 'bg-blue-100 text-blue-700' },
  ENDED:     { text: '종료됨',  color: 'bg-gray-100 text-gray-500' },
  CANCELLED: { text: '취소됨',  color: 'bg-red-100 text-red-400' },
}

const MODE_LABEL: Record<string, string> = {
  ALL: '모두획득형',
  COMPETITION: '경쟁형',
}

export default function JoinPage() {
  const router = useRouter()
  const { rooms, loading, search } = useSearchRooms()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    search(query)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">방 찾기</h1>

        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="방 이름을 검색하세요"
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            검색
          </button>
        </form>

        {loading && <p className="text-center text-sm text-gray-400">검색 중...</p>}

        <ul className="space-y-2">
          {rooms.map((room) => {
            const status = STATUS_LABEL[room.status]
            const canJoin = room.status === 'WAITING'
            return (
              <li key={room.id}>
                <button
                  onClick={() => canJoin && router.push(`/join/${room.id}`)}
                  disabled={!canJoin}
                  className={`w-full rounded-xl bg-white p-4 text-left shadow transition ${
                    canJoin ? 'hover:shadow-md active:bg-gray-50' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{room.room_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{MODE_LABEL[room.mode]}</p>
                </button>
              </li>
            )
          })}
        </ul>

        {!loading && rooms.length === 0 && query && (
          <p className="mt-8 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
        )}
      </div>
    </main>
  )
}
