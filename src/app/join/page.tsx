'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchRooms } from '@/features/player/useJoinRoom'

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  WAITING:   { text: '대기중',  color: 'bg-kgreen-bg text-kgreen-dark' },
  RUNNING:   { text: '진행중',  color: 'bg-blue-100 text-blue-700' },
  ENDED:     { text: '종료됨',  color: 'bg-kgray-bg text-kgray' },
  CANCELLED: { text: '취소됨',  color: 'bg-red-50 text-red-400' },
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
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto max-w-md">
        <h1
          className="mb-6 font-display text-[28px] font-bold text-knear"
          style={{ letterSpacing: '-0.5px' }}
        >
          방 찾기
        </h1>

        <form onSubmit={handleSearch} className="mb-5 flex gap-2">
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="방 이름을 검색하세요"
            className="flex-1 rounded-xl border border-kgray-border bg-kgray-bg px-3 py-2.5 text-sm text-knear placeholder:text-kgray-light outline-none transition focus:border-kp focus:bg-white focus:ring-1 focus:ring-kp"
          />
          <button
            type="submit"
            className="rounded-xl bg-kp px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-kp-dark"
          >
            검색
          </button>
        </form>

        {loading && (
          <p className="text-center text-sm text-kgray-light">검색 중...</p>
        )}

        <ul className="space-y-2">
          {rooms.map((room) => {
            const status = STATUS_LABEL[room.status]
            const canJoin = room.status === 'WAITING'
            return (
              <li key={room.id}>
                <button
                  onClick={() => canJoin && router.push(`/join/${room.id}`)}
                  disabled={!canJoin}
                  className={`w-full rounded-xl border border-kgray-border bg-white p-4 text-left shadow-kraken-micro transition-shadow ${
                    canJoin ? 'hover:shadow-kraken active:bg-kgray-bg' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-knear">{room.room_name}</span>
                    <span className={`rounded-[6px] px-2 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-kgray-light">{MODE_LABEL[room.mode]}</p>
                </button>
              </li>
            )
          })}
        </ul>

        {!loading && rooms.length === 0 && query && (
          <p className="mt-10 text-center text-sm text-kgray-light">검색 결과가 없습니다.</p>
        )}
      </div>
    </main>
  )
}
