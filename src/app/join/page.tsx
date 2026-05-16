'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchRooms } from '@/features/player/useJoinRoom'

const STATUS_CONFIG: Record<string, { text: string; pill: string; border: string; dim?: boolean }> = {
  WAITING:   { text: '대기중',  pill: 'bg-emerald-500/20 text-emerald-400',              border: 'border-l-emerald-500' },
  RUNNING:   { text: '진행중',  pill: 'bg-blue-500/20 text-blue-400',                    border: 'border-l-blue-500' },
  ENDED:     { text: '종료됨',  pill: 'bg-on-surface-variant/20 text-on-surface-variant', border: 'border-l-on-surface-variant', dim: true },
  CANCELLED: { text: '취소됨',  pill: 'bg-error-container/30 text-error',                border: 'border-l-error', dim: true },
}

const MODE_LABEL: Record<string, string> = { ALL: '모두획득형', COMPETITION: '경쟁형' }
const MODE_ICON:  Record<string, string> = { ALL: 'group',       COMPETITION: 'trophy'   }

export default function JoinPage() {
  const router = useRouter()
  const { rooms, loading, search } = useSearchRooms()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    search(query)
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container ring-2 ring-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontSize: 18 }}>person</span>
          </div>
          <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">SpotHunt</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full border border-white/5">
          <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>workspace_premium</span>
          <span className="text-xs font-semibold text-primary">XP: 0</span>
        </div>
      </header>

      <main className="pt-20 pb-24 px-5 min-h-screen max-w-[480px] mx-auto">
        {/* Search */}
        <div className="mb-4">
          <form onSubmit={handleSearch} className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="방 이름으로 검색..."
              className="w-full h-12 pl-12 pr-4 bg-surface-container border-2 border-outline-variant focus:border-tertiary focus:ring-0 rounded-xl text-on-surface placeholder:text-on-surface-variant/60 outline-none transition-all"
            />
          </form>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl font-bold text-on-surface">참여 가능한 방</h2>
          {rooms.length > 0 && (
            <span className="text-xs font-semibold text-on-surface-variant">{rooms.length}개</span>
          )}
        </div>

        {loading && (
          <p className="text-center text-sm text-on-surface-variant py-10 animate-pulse">검색 중...</p>
        )}

        {/* Room list */}
        <div className="space-y-4">
          {rooms.map((room) => {
            const cfg = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.ENDED
            const canJoin = room.status === 'WAITING'

            return (
              <button
                key={room.id}
                onClick={() => canJoin && router.push(`/join/${room.id}`)}
                disabled={!canJoin}
                className={`w-full text-left glass-panel p-4 rounded-xl flex items-center gap-4 border-l-4 transition-all ${cfg.border} ${
                  canJoin ? 'hover:opacity-90 active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                } ${cfg.dim ? 'grayscale-[0.3]' : ''}`}
              >
                <div className="w-12 h-12 flex-shrink-0 bg-surface-container-high rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>
                    {MODE_ICON[room.mode] ?? 'explore'}
                  </span>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-bold text-on-surface truncate block max-w-[160px]">{room.room_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${cfg.pill}`}>
                      {cfg.text}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">방식: {MODE_LABEL[room.mode] ?? '-'}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">chevron_right</span>
              </button>
            )
          })}

          {/* Empty: no query */}
          {!loading && rooms.length === 0 && !query && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 40 }}>search</span>
              </div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-2">방을 검색해보세요</h3>
              <p className="text-sm text-on-surface-variant px-8">방 이름을 입력하고 검색하면 참여 가능한 방이 표시됩니다.</p>
            </div>
          )}

          {/* Empty: no results */}
          {!loading && rooms.length === 0 && query && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 40 }}>location_off</span>
              </div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-2">검색 결과가 없어요</h3>
              <p className="text-sm text-on-surface-variant px-8">검색어를 바꾸거나, 직접 방을 만들어 보세요!</p>
              <Link
                href="/host/create"
                className="mt-8 h-12 px-8 bg-primary text-on-primary font-headline text-sm font-bold rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                방 만들기
              </Link>
            </div>
          )}
        </div>

        {/* FAB */}
        <Link
          href="/host/create"
          className="fixed right-5 bottom-20 w-14 h-14 bg-primary text-on-primary-container rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform z-40 border-2 border-white/20"
          style={{ boxShadow: '0 0 20px rgba(255,183,125,0.3)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>add</span>
        </Link>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-5 pb-2 h-16 bg-surface-container/90 backdrop-blur-lg border-t border-white/10 rounded-t-xl shadow-lg">
        <Link href="/" className="flex flex-col items-center justify-center text-on-surface-variant pt-2 hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">map</span>
          <span className="text-[11px] font-semibold">지도</span>
        </Link>
        <Link href="#" className="flex flex-col items-center justify-center text-on-surface-variant pt-2 hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[11px] font-semibold">점수판</span>
        </Link>
        <div className="flex flex-col items-center justify-center text-primary font-bold border-t-2 border-primary pt-2">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[11px] font-semibold">로비</span>
        </div>
      </nav>
    </div>
  )
}
