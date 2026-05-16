'use client'

import { useState } from 'react'
import { useCreateRoom } from '@/features/host/useCreateRoom'
import type { EventMode } from '@/types'

export default function CreateRoomPage() {
  const { createRoom, loading, error } = useCreateRoom()
  const [form, setForm] = useState({
    roomName: '',
    password: '',
    mode: 'ALL' as EventMode,
    description: '',
    maxPlayers: '',
  })

  const isValid = form.roomName.trim() && form.password.trim()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createRoom({
      roomName: form.roomName,
      password: form.password,
      mode: form.mode,
      description: form.description || undefined,
      maxPlayers: form.maxPlayers ? Number(form.maxPlayers) : undefined,
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">이벤트 방 만들기</h1>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">방 이름 *</label>
            <input
              name="roomName" value={form.roomName} onChange={handleChange}
              maxLength={30} placeholder="예: 우리 아파트 보물찾기"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호 *</label>
            <input
              name="password" type="password" value={form.password} onChange={handleChange}
              maxLength={20} placeholder="참여자에게 알려줄 비밀번호"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">이벤트 방식 *</label>
            <select
              name="mode" value={form.mode} onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="ALL">모두획득형 — 모든 참여자가 각 아이템 획득 가능</option>
              <option value="COMPETITION">경쟁형 — 선착순으로 아이템 획득</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">이벤트 설명 (선택)</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              rows={2} placeholder="이벤트에 대한 간단한 설명"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">최대 참여자 수 (선택)</label>
            <input
              name="maxPlayers" type="number" min="1" value={form.maxPlayers} onChange={handleChange}
              placeholder="제한 없으면 비워두세요"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="submit" disabled={!isValid || loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-40 hover:bg-indigo-700"
          >
            {loading ? '생성 중...' : '다음 →'}
          </button>
        </form>
      </div>
    </main>
  )
}
