'use client'

import Link from 'next/link'
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
  const medals = ['🥇', '🥈', '🥉']

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl animate-pulse">progress_activity</span>
        <p className="text-sm text-on-surface-variant">로딩 중...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10 gap-3">
        <button onClick={() => router.back()} className="text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">SpotHunt</span>
        <span className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
          점수판
        </span>
      </header>

      <main className="pt-20 pb-10 px-5 max-w-[480px] mx-auto space-y-4">
        {/* My score */}
        {myScore ? (
          <div
            className="rounded-2xl p-6 text-center relative overflow-hidden border-2 border-primary/30"
            style={{ background: 'linear-gradient(135deg, rgba(255,140,0,0.2) 0%, rgba(233,196,0,0.08) 100%)' }}
          >
            <div className="absolute inset-0 glass-card rounded-2xl" />
            <div className="relative z-10">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1">
                {myRank}위 · {myScore.participant.nickname}
              </p>
              <p className="font-headline text-6xl font-extrabold text-primary" style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
                {myScore.score}
                <span className="text-xl font-normal text-on-surface-variant ml-1">점</span>
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">{myScore.itemCount}개 획득</p>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">inventory_2</span>
            <p className="text-on-surface-variant text-sm mt-2">아직 획득한 아이템이 없어요</p>
          </div>
        )}

        {/* My items */}
        {myRecords.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-headline text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>inventory_2</span>
              내 획득 아이템
            </h2>
            <ul className="space-y-2">
              {myRecords.map((r) => (
                <li key={r.id} className="flex items-center gap-3 bg-surface-container rounded-xl px-3 py-2.5">
                  <span className="text-2xl">{ITEM_IMAGES[r.item.image_key as ItemImageKey] ?? '📍'}</span>
                  <span className="flex-1 text-sm text-on-surface">{r.item.name}</span>
                  <span className="text-sm font-bold text-primary">+{r.item.score}점</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rankings */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-headline text-base font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>leaderboard</span>
            전체 랭킹
          </h2>
          {scores.length === 0 ? (
            <div className="py-6 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">timer</span>
              <p className="text-sm text-on-surface-variant mt-2">아직 획득한 참여자가 없습니다</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {scores.map((s, i) => {
                const isMe = s.participant.id === session?.participantId
                return (
                  <li
                    key={s.participant.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      isMe ? 'bg-primary/15 border border-primary/20' : 'bg-surface-container'
                    }`}
                  >
                    <span className="w-6 text-center text-sm">{medals[i] ?? `${i + 1}`}</span>
                    <span className={`flex-1 text-sm ${isMe ? 'font-bold text-primary' : 'text-on-surface'}`}>
                      {s.participant.nickname}
                      {isMe && <span className="ml-1 text-[10px] text-on-surface-variant opacity-70">(나)</span>}
                    </span>
                    <span className="text-xs text-on-surface-variant">{s.itemCount}개</span>
                    <span className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-on-surface'}`}>{s.score}점</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <button
          onClick={() => router.push(`/join/${roomId}/play`)}
          className="w-full h-12 bg-primary text-on-primary font-headline text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
        >
          <span className="material-symbols-outlined">map</span>
          지도로 돌아가기
        </button>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-5 pb-2 h-16 bg-surface-container/90 backdrop-blur-lg border-t border-white/10 rounded-t-xl shadow-lg">
        <Link href={`/join/${roomId}/play`} className="flex flex-col items-center justify-center text-on-surface-variant pt-2">
          <span className="material-symbols-outlined">map</span>
          <span className="text-[11px] font-semibold">지도</span>
        </Link>
        <div className="flex flex-col items-center justify-center text-primary font-bold border-t-2 border-primary pt-2">
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[11px] font-semibold">점수판</span>
        </div>
        <Link href={`/join/${roomId}/lobby`} className="flex flex-col items-center justify-center text-on-surface-variant pt-2">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[11px] font-semibold">로비</span>
        </Link>
      </nav>
    </div>
  )
}
