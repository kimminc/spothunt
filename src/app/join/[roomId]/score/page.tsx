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

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center text-kgray-light">로딩 중...</div>
  )

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-kgray-bg text-kgray transition-colors hover:bg-kgray-border"
          >
            ←
          </button>
          <h1
            className="font-display text-xl font-bold text-knear"
            style={{ letterSpacing: '-0.5px' }}
          >
            점수판
          </h1>
        </div>

        {/* 내 점수 */}
        {myScore && (
          <div className="rounded-2xl bg-kp p-6 text-white text-center shadow-kraken">
            <p className="text-sm opacity-75">{myRank}위 · {myScore.participant.nickname}</p>
            <p className="text-5xl font-bold mt-2">{myScore.score}<span className="text-2xl font-normal ml-1">점</span></p>
            <p className="text-sm opacity-60 mt-1">{myScore.itemCount}개 획득</p>
          </div>
        )}

        {/* 내 획득 목록 */}
        {myRecords.length > 0 && (
          <div className="rounded-2xl border border-kgray-border bg-white p-5 shadow-kraken">
            <h2 className="mb-3 font-semibold text-knear">내 획득 아이템</h2>
            <ul className="space-y-2.5">
              {myRecords.map((r) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="text-2xl">{ITEM_IMAGES[r.item.image_key as ItemImageKey] ?? '📍'}</span>
                  <span className="flex-1 text-sm text-knear">{r.item.name}</span>
                  <span className="text-sm font-bold text-kp">+{r.item.score}점</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 전체 랭킹 */}
        <div className="rounded-2xl border border-kgray-border bg-white p-5 shadow-kraken">
          <h2 className="mb-3 font-semibold text-knear">전체 랭킹</h2>
          <ul className="space-y-1.5">
            {scores.map((s, i) => {
              const isMe = s.participant.id === session?.participantId
              const medals = ['🥇', '🥈', '🥉']
              return (
                <li
                  key={s.participant.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                    isMe ? 'bg-kp-faint' : 'hover:bg-kgray-bg'
                  }`}
                >
                  <span className="w-6 text-center text-sm">{medals[i] ?? `${i + 1}`}</span>
                  <span className={`flex-1 text-sm ${isMe ? 'font-bold text-kp' : 'text-knear'}`}>
                    {s.participant.nickname} {isMe && <span className="text-xs opacity-70">(나)</span>}
                  </span>
                  <span className="text-sm font-bold text-knear">{s.score}점</span>
                </li>
              )
            })}
          </ul>
        </div>

        <button
          onClick={() => router.push(`/join/${roomId}/play`)}
          className="w-full rounded-xl bg-kp py-[13px] text-base font-semibold text-white transition-colors hover:bg-kp-dark"
        >
          지도로 돌아가기 →
        </button>
      </div>
    </main>
  )
}
