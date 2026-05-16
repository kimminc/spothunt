'use client'

import { useParams } from 'next/navigation'
import { useHostLive } from '@/features/host/useHostLive'

export default function LivePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, items, participants, scores, totalCollected, ending, endEvent } = useHostLive(roomId)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">

        {/* 헤더 */}
        <div className="rounded-2xl bg-kp p-6 text-white shadow-kraken">
          <h1
            className="font-display text-xl font-bold"
            style={{ letterSpacing: '-0.5px' }}
          >
            {room?.room_name ?? '이벤트 진행 중'}
          </h1>
          <p className="mt-1 text-sm opacity-75">
            {room?.mode === 'ALL' ? '모두획득형' : '경쟁형'} · 실시간
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '참여자', value: participants.length, unit: '명' },
            { label: '전체 아이템', value: items.length, unit: '개' },
            { label: '획득 완료', value: totalCollected, unit: '회' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-kgray-border bg-white p-4 text-center shadow-kraken-micro">
              <p className="text-2xl font-bold text-kp">
                {stat.value}
                <span className="text-sm font-medium text-kgray-light ml-0.5">{stat.unit}</span>
              </p>
              <p className="mt-1 text-xs text-kgray-light">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 실시간 순위 */}
        <div className="rounded-2xl border border-kgray-border bg-white p-5 shadow-kraken">
          <h2 className="mb-3 font-semibold text-knear">실시간 순위</h2>
          {scores.length === 0 ? (
            <p className="py-4 text-center text-sm text-kgray-light">아직 획득한 참여자가 없습니다</p>
          ) : (
            <ul className="space-y-1.5">
              {scores.map((s, i) => (
                <li key={s.participant.id} className="flex items-center gap-3 rounded-xl bg-kgray-bg px-3 py-2.5">
                  <span className="w-6 text-center text-sm">{medals[i] ?? `${i + 1}`}</span>
                  <span className="flex-1 text-sm font-medium text-knear">{s.participant.nickname}</span>
                  <span className="text-xs text-kgray-light">{s.itemCount}개</span>
                  <span className="text-sm font-bold text-kp">{s.score}점</span>
                </li>
              ))}
              {participants
                .filter((p) => !scores.find((s) => s.participant.id === p.id))
                .map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl bg-kgray-bg px-3 py-2.5 opacity-40">
                    <span className="w-6 text-center text-kgray-light">-</span>
                    <span className="flex-1 text-sm text-kgray">{p.nickname}</span>
                    <span className="text-sm text-kgray-light">0점</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* 종료 버튼 */}
        <button
          onClick={endEvent}
          disabled={ending}
          className="w-full rounded-xl bg-red-500 py-4 text-base font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          {ending ? '종료 처리 중...' : '이벤트 종료'}
        </button>
      </div>
    </main>
  )
}
