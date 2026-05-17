'use client'

import { useParams } from 'next/navigation'
import { useHostLive } from '@/features/host/useHostLive'

export default function LivePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, items, participants, scores, totalCollected, ending, endEvent } = useHostLive(roomId)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-background text-on-background pb-10">
      <div className="fixed inset-0 -z-10 topo-bg" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">SpotHunt</span>
          <span className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-emerald-400">진행 중</span>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-[480px] mx-auto space-y-4">
        {/* Room info */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-primary">
          <h1 className="font-headline text-xl font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
            {room?.room_name ?? '이벤트 진행 중'}
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            {room?.mode === 'ALL' ? '모두획득형' : '경쟁형'} · 실시간 진행 중
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '참여자', value: participants.length, unit: '명', icon: 'group', color: 'text-primary' },
            { label: '전체 아이템', value: items.length, unit: '개', icon: 'inventory_2', color: 'text-tertiary' },
            { label: '획득 완료', value: totalCollected, unit: '회', icon: 'check_circle', color: 'text-on-secondary-container' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-3 text-center">
              <span className={`material-symbols-outlined ${stat.color}`} style={{ fontSize: 20 }}>{stat.icon}</span>
              <p className={`font-headline text-2xl font-bold ${stat.color} leading-none mt-1`}>
                {stat.value}
                <span className="text-[10px] font-normal text-on-surface-variant ml-0.5">{stat.unit}</span>
              </p>
              <p className="mt-1 text-[10px] text-on-surface-variant">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Rankings */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-headline text-base font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>leaderboard</span>
            실시간 순위
          </h2>
          {scores.length === 0 ? (
            <div className="py-6 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">timer</span>
              <p className="text-sm text-on-surface-variant mt-2">아직 획득한 참여자가 없습니다</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {scores.map((s, i) => (
                <li key={s.participant.id} className="flex items-center gap-3 bg-surface-container rounded-xl px-3 py-2.5">
                  <span className="w-6 text-center text-sm">{medals[i] ?? `${i + 1}`}</span>
                  <span className="flex-1 text-sm font-medium text-on-surface">{s.participant.nickname}</span>
                  <span className="text-xs text-on-surface-variant">{s.itemCount}개</span>
                  <span className="text-sm font-bold text-primary">{s.score}점</span>
                </li>
              ))}
              {participants
                .filter((p) => !scores.find((s) => s.participant.id === p.id))
                .map((p) => (
                  <li key={p.id} className="flex items-center gap-3 bg-surface-container rounded-xl px-3 py-2.5 opacity-40">
                    <span className="w-6 text-center text-sm text-on-surface-variant">-</span>
                    <span className="flex-1 text-sm text-on-surface-variant">{p.nickname}</span>
                    <span className="text-sm text-on-surface-variant">0점</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* End event */}
        <button
          onClick={endEvent}
          disabled={ending}
          className="w-full h-12 rounded-xl border-2 border-error/40 text-error text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>stop_circle</span>
          {ending ? '종료 처리 중...' : '이벤트 종료'}
        </button>
      </main>
    </div>
  )
}
