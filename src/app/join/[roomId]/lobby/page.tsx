'use client'

import { useParams } from 'next/navigation'
import { usePlayerLobby } from '@/features/player/usePlayerLobby'

export default function PlayerLobbyPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, participantCount, loading } = usePlayerLobby(roomId)

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">로딩 중...</div>
  if (!room) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{room.room_name}</h1>
          <p className="mt-1 text-sm text-gray-400">{room.mode === 'ALL' ? '모두획득형' : '경쟁형'}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-2 text-4xl">⏳</div>
          <p className="font-semibold text-gray-700">주최자가 이벤트를 시작할 때까지</p>
          <p className="text-gray-500">기다려주세요</p>
        </div>

        <div className="rounded-xl bg-indigo-50 px-4 py-3">
          <p className="text-sm text-indigo-600">
            현재 참여자 <span className="font-bold">{participantCount}명</span>
          </p>
        </div>

        {/* 이벤트 시작 시 자동으로 플레이 화면으로 이동합니다 */}
      </div>
    </main>
  )
}
