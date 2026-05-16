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

  if (!room) return (
    <div className="flex min-h-screen items-center justify-center text-kgray-light">로딩 중...</div>
  )

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <h1
            className="font-display text-[28px] font-bold text-knear"
            style={{ letterSpacing: '-0.5px' }}
          >
            {room.room_name}
          </h1>
          <p className="mt-1 text-sm text-kgray-light">
            {room.mode === 'ALL' ? '모두획득형' : '경쟁형'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-kgray-border bg-white p-6 shadow-kraken">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-knear">비밀번호</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="주최자에게 받은 비밀번호"
              className="w-full rounded-xl border border-kgray-border bg-kgray-bg px-3 py-2.5 text-sm text-knear placeholder:text-kgray-light outline-none transition focus:border-kp focus:bg-white focus:ring-1 focus:ring-kp"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-knear">닉네임</label>
            <input
              value={nickname} onChange={(e) => setNickname(e.target.value)}
              placeholder="게임에서 표시될 이름"
              maxLength={20}
              className="w-full rounded-xl border border-kgray-border bg-kgray-bg px-3 py-2.5 text-sm text-knear placeholder:text-kgray-light outline-none transition focus:border-kp focus:bg-white focus:ring-1 focus:ring-kp"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit" disabled={!isValid || loading}
            className="w-full rounded-xl bg-kp py-[13px] text-base font-semibold text-white transition-colors hover:bg-kp-dark disabled:opacity-40"
          >
            {loading ? '입장 중...' : '입장하기'}
          </button>
        </form>
      </div>
    </main>
  )
}
