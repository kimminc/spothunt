'use client'

import { useParams, useRouter } from 'next/navigation'
import { useScoreBoard } from '@/features/player/useScoreBoard'
import { getPlayerSession } from '@/lib/session'
import { ITEM_IMAGES, type ItemImageKey } from '@/types'

export default function ScorePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const { scores, myRecords, loading } = useScoreBoard(roomId)
  const session = getPlayerSession()

  const myScore = scores.find((s) => s.participant.id === session?.participantId)
  const myRank = myScore ? scores.indexOf(myScore) + 1 : null

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">로딩 중...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="text-xl font-bold text-gray-900">점수판</h1>
        </div>

        {/* 내 점수 */}
        {myScore && (
          <div className="rounded-2xl bg-indigo-600 p-5 text-white text-center">
            <p className="text-sm opacity-80">{myRank}위 · {myScore.participant.nickname}</p>
            <p className="text-4xl font-bold mt-1">{myScore.score}점</p>
            <p className="text-sm opacity-70 mt-1">{myScore.itemCount}개 획득</p>
          </div>
        )}

        {/* 내 획득 목록 */}
        {myRecords.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow">
            <h2 className="mb-3 font-semibold text-gray-800">내 획득 아이템</h2>
            <ul className="space-y-2">
              {myRecords.map((r) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="text-2xl">{ITEM_IMAGES[r.item.image_key as ItemImageKey] ?? '📍'}</span>
                  <span className="flex-1 text-sm text-gray-700">{r.item.name}</span>
                  <span className="text-sm font-bold text-indigo-600">+{r.item.score}점</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 전체 랭킹 */}
        <div className="rounded-2xl bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold text-gray-800">전체 랭킹</h2>
          <ul className="space-y-2">
            {scores.map((s, i) => {
              const isMe = s.participant.id === session?.participantId
              const medals = ['🥇', '🥈', '🥉']
              return (
                <li key={s.participant.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${isMe ? 'bg-indigo-50' : ''}`}
                >
                  <span className="w-6 text-center">{medals[i] ?? `${i + 1}`}</span>
                  <span className={`flex-1 text-sm ${isMe ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                    {s.participant.nickname} {isMe && '(나)'}
                  </span>
                  <span className="text-sm font-bold text-gray-800">{s.score}점</span>
                </li>
              )
            })}
          </ul>
        </div>

        <button
          onClick={() => router.push(`/join/${roomId}/play`)}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
        >
          지도로 돌아가기 →
        </button>
      </div>
    </main>
  )
}
