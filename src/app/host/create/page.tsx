'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCreateRoom } from '@/features/host/useCreateRoom'
import type { EventMode } from '@/types'

export default function CreateRoomPage() {
  const { createRoom, loading, error } = useCreateRoom()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    roomName: '',
    password: '',
    mode: 'ALL' as EventMode,
    description: '',
    maxPlayers: '',
  })

  const isValid = form.roomName.trim() && form.password.trim()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!isValid || loading) return
    await createRoom({
      roomName: form.roomName,
      password: form.password,
      mode: form.mode,
      description: form.description || undefined,
      maxPlayers: form.maxPlayers ? Number(form.maxPlayers) : undefined,
    })
  }

  return (
    <div className="min-h-screen bg-background text-on-background pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">SpotHunt</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full border border-white/10">
          <span className="text-xs font-semibold text-primary">XP: 0</span>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-[480px] mx-auto">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <h1 className="font-headline text-2xl font-bold text-primary">방 만들기</h1>
            <span className="text-xs font-semibold text-on-surface-variant">Step 1 / 3</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-tertiary w-1/3 rounded-full" />
          </div>
          <p className="mt-3 text-sm text-on-surface-variant">이벤트 방의 기본 정보를 입력해 주세요.</p>
        </div>

        <div className="space-y-6">
          {/* Room Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">방 이름 *</label>
            <input
              name="roomName"
              value={form.roomName}
              onChange={handleChange}
              maxLength={30}
              placeholder="예: 우리 아파트 보물찾기"
              className="w-full h-12 bg-surface-container border border-outline-variant rounded-xl px-4 text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">비밀번호 *</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                maxLength={20}
                placeholder="참여자에게 알려줄 비밀번호"
                className="w-full h-12 bg-surface-container border border-outline-variant rounded-xl px-4 pr-12 text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all placeholder:text-on-surface-variant/50"
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

          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">게임 방식 *</label>
            <div className="grid grid-cols-1 gap-3">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="ALL"
                  checked={form.mode === 'ALL'}
                  onChange={() => setForm((p) => ({ ...p, mode: 'ALL' }))}
                  className="sr-only"
                />
                <div
                  className={`glass-card p-4 rounded-xl flex items-center gap-4 border-2 transition-all active:scale-[0.98] ${
                    form.mode === 'ALL' ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-on-surface">모두 획득형</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">모든 참여자가 각 아이템을 획득할 수 있어요.</p>
                  </div>
                  {form.mode === 'ALL' && (
                    <span className="material-symbols-outlined text-primary flex-shrink-0">check_circle</span>
                  )}
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="COMPETITION"
                  checked={form.mode === 'COMPETITION'}
                  onChange={() => setForm((p) => ({ ...p, mode: 'COMPETITION' }))}
                  className="sr-only"
                />
                <div
                  className={`glass-card p-4 rounded-xl flex items-center gap-4 border-2 transition-all active:scale-[0.98] ${
                    form.mode === 'COMPETITION' ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary flex-shrink-0">
                    <span className="material-symbols-outlined">trophy</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-on-surface">경쟁형</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">선착순으로만 획득 가능. 한 명만 먼저!</p>
                  </div>
                  {form.mode === 'COMPETITION' && (
                    <span className="material-symbols-outlined text-primary flex-shrink-0">check_circle</span>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Max Players */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">
              최대 참여자 수 <span className="text-on-surface-variant normal-case font-normal">(선택)</span>
            </label>
            <input
              name="maxPlayers"
              type="number"
              min="1"
              value={form.maxPlayers}
              onChange={handleChange}
              placeholder="제한 없으면 비워두세요"
              className="w-full h-12 bg-surface-container border border-outline-variant rounded-xl px-4 text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">
              이벤트 설명 <span className="text-on-surface-variant normal-case font-normal">(선택)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="오늘 무엇을 사냥하나요?"
              className="w-full bg-surface-container border border-outline-variant rounded-xl p-4 text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all placeholder:text-on-surface-variant/50 resize-none"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-error-container/50 px-4 py-3 text-sm text-on-error-container border border-error/20">
              {error}
            </p>
          )}
        </div>

        {/* Decorative panel */}
        <div className="mt-8 rounded-2xl overflow-hidden h-40 relative glass-card border border-white/10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(135deg, rgba(255,140,0,0.12) 0%, rgba(233,196,0,0.08) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
          <div className="absolute top-1/2 right-6 -translate-y-1/2 text-5xl opacity-40 select-none">🗺️</div>
          <div className="absolute bottom-4 left-4">
            <p className="text-sm font-bold text-primary font-headline">모험이 기다리고 있어요</p>
            <p className="text-xs text-on-surface-variant mt-0.5">사냥꾼들이 도착할 준비를 하세요.</p>
          </div>
        </div>
      </main>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 w-full z-50 px-5 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full h-12 bg-primary text-on-primary font-headline text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg disabled:opacity-40"
          >
            <span>{loading ? '생성 중...' : '다음 단계'}</span>
            {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
          </button>
        </div>
      </footer>
    </div>
  )
}
