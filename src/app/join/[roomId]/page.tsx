'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useJoinRoom } from '@/features/player/useJoinRoom'

export default function JoinRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, loading, error, loadRoom, join } = useJoinRoom(roomId)
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { loadRoom() }, []) // eslint-disable-line

  const isValid = password.trim() && nickname.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await join(password, nickname)
  }

  if (!room) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl animate-pulse">
          {loading ? 'progress_activity' : 'error_outline'}
        </span>
        <p className="text-sm text-on-surface-variant">{loading ? '로딩 중...' : '방을 찾을 수 없습니다'}</p>
      </div>
    </div>
  )

  const modeLabel = room.mode === 'ALL' ? '모두획득형' : '경쟁형'

  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="fixed inset-0 -z-10 topo-bg" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Link href="/join" className="text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">SpotHunt</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
          대기중
        </span>
      </header>

      <main className="pt-20 pb-10 px-5 max-w-[480px] mx-auto">
        {/* Room info */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>explore</span>
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">{modeLabel}</span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
            {room.room_name}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">비밀번호를 입력하고 게임에 참여하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nickname */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">닉네임 *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">badge</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="게임에서 표시될 이름"
                className="w-full h-12 pl-12 pr-4 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">비밀번호 *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="주최자에게 받은 비밀번호"
                className="w-full h-12 pl-12 pr-12 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all placeholder:text-on-surface-variant/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-error-container/50 px-4 py-3 text-sm text-on-error-container border border-error/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full h-12 bg-primary text-on-primary font-headline text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg disabled:opacity-40"
          >
            <span className="material-symbols-outlined">login</span>
            {loading ? '입장 중...' : '입장하기'}
          </button>
        </form>

        {/* Room preview */}
        <div className="mt-8 glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary">explore</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{room.room_name}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{modeLabel}</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider flex-shrink-0">
            대기중
          </span>
        </div>
      </main>
    </div>
  )
}
