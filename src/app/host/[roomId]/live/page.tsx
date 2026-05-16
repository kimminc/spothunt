'use client'

import { useParams } from 'next/navigation'
import { useHostLive } from '@/features/host/useHostLive'

export default function LivePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, items, participants, scores, totalCollected, ending, endEvent } = useHostLive(roomId)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md space-y-4">

        {/* 헤더 */}
        <div className="rounded-2xl bg-indigo-600 p-5 text-white">
          <h1 className="text-lg font-bold">{room?.room_name ?? '이벤트 진행 중'}</h1>
          <p className="mt-1 text-sm opacity-80">{room?.mode === 'ALL' ? '모두획득형' : '경쟁형'} · 실시간</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '참여자', value: participants.length, unit: '명' },
            { label: '전체 아이템', value: items.length, unit: '개' },
            { label: '획득 완료', value: totalCollected, unit: '회' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-4 text-center shadow">
              <p className="text-2xl font-bold text-indigo-600">{stat.value}<span className="text-sm">{stat.unit}</span></p>
              <p className="mt-1 text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 실시간 점수 */}
        <div className="rounded-2xl bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold text-gray-800">실시간 순위</h2>
          {scores.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-2">아직 획득한 참여자가 없습니다</p>
          ) : (
            <ul className="space-y-2">
              {scores.map((s, i) => (
                <li key={s.participant.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
                  <span className="w-6 text-center">{medals[i] ?? `${i + 1}`}</span>
                  <span className="flex-1 text-sm font-medium text-gray-700">{s.participant.nickname}</span>
                  <span className="text-xs text-gray-400">{s.itemCount}개</span>
                  <span className="text-sm font-bold text-indigo-600">{s.score}점</span>
                </li>
              ))}
              {/* 참여자 중 아직 획득 없는 사람 */}
              {participants
                .filter((p) => !scores.find((s) => s.participant.id === p.id))
                .map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 opacity-50">
                    <span className="w-6 text-center text-gray-300">-</span>
                    <span className="flex-1 text-sm text-gray-500">{p.nickname}</span>
                    <span className="text-sm text-gray-400">0점</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* 종료 버튼 */}
        <button
          onClick={endEvent}
          disabled={ending}
          className="w-full rounded-xl bg-red-500 py-4 text-base font-bold text-white shadow disabled:opacity-50 hover:bg-red-600"
        >
          {ending ? '종료 처리 중...' : '이벤트 종료'}
        </button>
      </div>
    </main>
  )
}
