'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useJoinRoom } from '@/features/player/useJoinRoom'

export default function JoinRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, loading, error, loadRoom, join } = useJoinRoom(roomId)
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  useEffect(() => { loadRoom() }, [])  // eslint-disable-line

  const isValid = password.trim() && nickname.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await join(password, nickname)
  }

  if (!room) return <div className="flex min-h-screen items-center justify-center text-gray-400">로딩 중...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">{room.room_name}</h1>
        <p className="mb-6 text-sm text-gray-400">{room.mode === 'ALL' ? '모두획득형' : '경쟁형'}</p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="주최자에게 받은 비밀번호"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">닉네임</label>
            <input
              value={nickname} onChange={(e) => setNickname(e.target.value)}
              placeholder="게임에서 표시될 이름"
              maxLength={20}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="submit" disabled={!isValid || loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-40 hover:bg-indigo-700"
          >
            {loading ? '입장 중...' : '입장하기'}
          </button>
        </form>
      </div>
    </main>
  )
}
