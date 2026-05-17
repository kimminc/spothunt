'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useHostLobby } from '@/features/host/useHostLobby'

export default function HostLobbyPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, participants, loading, error, starting, startEvent, deleteRoom } = useHostLobby(roomId)

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl animate-pulse">progress_activity</span>
        <p className="text-sm text-on-surface-variant">로딩 중...</p>
      </div>
    </div>
  )
  if (!room) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-error text-sm">방을 찾을 수 없습니다.</p>
    </div>
  )

  const canStart = participants.length >= 1
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${roomId}` : ''

  return (
    <div className="min-h-screen bg-background text-on-background pb-10">
      <div className="fixed inset-0 -z-10 topo-bg" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">SpotHunt</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface-variant uppercase tracking-wider">
          주최자
        </span>
      </header>

      <main className="pt-20 px-5 max-w-[480px] mx-auto space-y-4">
        {/* Room info */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="font-headline text-xl font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
                {room.room_name}
              </h1>
              <p className="mt-1 text-xs text-on-surface-variant">
                {room.mode === 'ALL' ? '모두획득형' : '경쟁형'}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider flex-shrink-0">
              대기중
            </span>
          </div>

          {/* Share link */}
          <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>share</span>
              <p className="text-xs font-semibold text-primary">참여자 링크 공유</p>
            </div>
            <p className="break-all text-xs text-on-surface-variant font-mono leading-relaxed">{joinUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(joinUrl)}
              className="mt-3 h-8 px-4 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span>
              링크 복사
            </button>
          </div>
        </div>

        {/* Participants */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-base font-bold text-on-surface">참여자</h2>
            <span className="px-3 py-1 rounded-full bg-primary/20 text-xs font-bold text-primary">
              {participants.length}명
            </span>
          </div>
          {participants.length === 0 ? (
            <div className="py-6 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">group_add</span>
              <p className="text-sm text-on-surface-variant mt-2">아직 참여자가 없습니다.<br />링크를 공유하세요.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {participants.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 bg-surface-container rounded-xl px-3 py-2.5">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm text-on-surface">{p.nickname}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Zone / Items links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/host/${roomId}/zone`}
            className="glass-panel rounded-xl py-3 px-4 flex items-center gap-2 text-sm font-semibold text-on-surface border border-outline-variant/50 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>map</span>
            구역 설정
          </Link>
          <Link
            href={`/host/${roomId}/items`}
            className="glass-panel rounded-xl py-3 px-4 flex items-center gap-2 text-sm font-semibold text-on-surface border border-outline-variant/50 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>inventory_2</span>
            아이템 수정
          </Link>
        </div>

        {error && (
          <p className="rounded-xl bg-error-container/50 px-4 py-3 text-sm text-on-error-container border border-error/20">{error}</p>
        )}

        {!canStart && (
          <p className="text-center text-xs font-medium text-tertiary flex items-center justify-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
            참여자가 1명 이상 있어야 시작할 수 있습니다
          </p>
        )}

        <button
          onClick={startEvent}
          disabled={!canStart || starting}
          className="w-full h-14 bg-primary text-on-primary font-headline text-base font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg disabled:opacity-40"
          style={{ boxShadow: canStart ? '0 0 24px rgba(255,183,125,0.3)' : undefined }}
        >
          <span className="material-symbols-outlined">{starting ? 'hourglass_top' : 'rocket_launch'}</span>
          {starting ? '시작 중...' : canStart ? '이벤트 시작' : '참여자를 기다리는 중...'}
        </button>

        <button
          onClick={deleteRoom}
          className="w-full h-11 rounded-xl border border-error/30 text-error text-sm font-semibold active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          방 삭제
        </button>
      </main>
    </div>
  )
}
