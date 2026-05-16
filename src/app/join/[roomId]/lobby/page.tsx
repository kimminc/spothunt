'use client'

import { useParams } from 'next/navigation'
import { usePlayerLobby } from '@/features/player/usePlayerLobby'

export default function PlayerLobbyPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, participantCount, loading } = usePlayerLobby(roomId)

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center text-kgray-light">로딩 중...</div>
  )
  if (!room) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1
            className="font-display text-2xl font-bold text-knear"
            style={{ letterSpacing: '-0.5px' }}
          >
            {room.room_name}
          </h1>
          <p className="mt-1 text-sm text-kgray-light">
            {room.mode === 'ALL' ? '모두획득형' : '경쟁형'}
          </p>
        </div>

        <div className="rounded-2xl border border-kgray-border bg-white p-8 shadow-kraken">
          <div className="mb-4 text-5xl">⏳</div>
          <p className="font-semibold text-knear">주최자가 이벤트를 시작할 때까지</p>
          <p className="mt-1 text-sm text-kgray-light">잠시만 기다려주세요</p>
        </div>

        <div className="rounded-xl bg-kp-faint px-4 py-3">
          <p className="text-sm text-kp">
            현재 참여자{' '}
            <span className="font-bold">{participantCount}명</span>
          </p>
        </div>
      </div>
    </main>
  )
}
