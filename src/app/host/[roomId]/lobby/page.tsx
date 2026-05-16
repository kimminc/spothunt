'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useHostLobby } from '@/features/host/useHostLobby'

export default function HostLobbyPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, participants, loading, error, starting, startEvent, deleteRoom } = useHostLobby(roomId)

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">로딩 중...</div>
  if (!room) return <div className="flex min-h-screen items-center justify-center text-red-400">방을 찾을 수 없습니다.</div>

  const canStart = participants.length >= 1
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${roomId}` : ''

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-xl font-bold text-gray-900">{room.room_name}</h1>
          <p className="mt-1 text-sm text-gray-400">{room.mode === 'ALL' ? '모두획득형' : '경쟁형'}</p>

          {/* 공유 링크 */}
          <div className="mt-4 rounded-xl bg-indigo-50 p-3">
            <p className="mb-1 text-xs font-medium text-indigo-600">참여자 링크 공유</p>
            <p className="break-all text-xs text-indigo-800">{joinUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(joinUrl)}
              className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              링크 복사
            </button>
          </div>
        </div>

        {/* 참여자 목록 */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">참여자</h2>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
              {participants.length}명
            </span>
          </div>
          {participants.length === 0 ? (
            <p className="text-sm text-gray-400">아직 참여자가 없습니다. 링크를 공유하세요.</p>
          ) : (
            <ul className="space-y-2">
              {participants.map((p) => (
                <li key={p.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {p.nickname}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {/* 아이템 설정 링크 */}
        <div className="flex gap-2">
          <Link
            href={`/host/${roomId}/zone`}
            className="flex-1 rounded-xl border-2 border-indigo-200 py-3 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            아이템 수정
          </Link>
        </div>

        {/* 시작 / 삭제 버튼 */}
        <button
          onClick={startEvent}
          disabled={!canStart || starting}
          className="w-full rounded-xl bg-indigo-600 py-4 text-base font-bold text-white shadow disabled:opacity-40 hover:bg-indigo-700"
        >
          {starting ? '시작 중...' : canStart ? '이벤트 시작 🚀' : '참여자를 기다리는 중...'}
        </button>

        <button
          onClick={deleteRoom}
          className="w-full rounded-xl border border-red-200 py-3 text-sm text-red-400 hover:bg-red-50"
        >
          방 삭제
        </button>
      </div>
    </main>
  )
}
