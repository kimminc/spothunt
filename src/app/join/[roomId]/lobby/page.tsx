'use client'

import { useParams } from 'next/navigation'
import { usePlayerLobby } from '@/features/player/usePlayerLobby'

export default function PlayerLobbyPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, participantCount, loading } = usePlayerLobby(roomId)

  if (loading || !room) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl animate-pulse">progress_activity</span>
        <p className="text-sm text-on-surface-variant">로딩 중...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <div className="fixed inset-0 -z-10 topo-bg" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">SpotHunt</span>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full border border-white/5">
          <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>group</span>
          <span className="text-xs font-semibold text-on-surface">{participantCount}명 대기 중</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 pt-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          {/* Room info */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>explore</span>
              <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
                {room.mode === 'ALL' ? '모두획득형' : '경쟁형'}
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
              {room.room_name}
            </h1>
          </div>

          {/* Waiting card */}
          <div className="glass-card rounded-2xl p-8 space-y-4">
            <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto border-4 border-outline-variant">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 40 }}>hourglass_top</span>
            </div>
            <div>
              <p className="font-headline text-lg font-bold text-on-surface">이벤트 시작 대기 중</p>
              <p className="mt-1 text-sm text-on-surface-variant">주최자가 시작하면 자동으로 게임이 시작됩니다</p>
            </div>
          </div>

          {/* Participant count */}
          <div className="glass-panel rounded-xl px-6 py-4 flex items-center justify-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <p className="text-sm text-on-surface-variant">
              현재{' '}
              <span className="font-bold text-primary">{participantCount}명</span>
              {' '}이 대기 중이에요
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
