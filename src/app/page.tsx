import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">SpotHunt</h1>
          <p className="mt-2 text-gray-500">위치 기반 이벤트 보물찾기</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/host/create"
            className="block w-full rounded-xl bg-indigo-600 px-6 py-4 text-center text-lg font-semibold text-white shadow hover:bg-indigo-700 active:bg-indigo-800"
          >
            주최자로 시작하기
          </Link>
          <Link
            href="/join"
            className="block w-full rounded-xl border-2 border-indigo-600 px-6 py-4 text-center text-lg font-semibold text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100"
          >
            참여자로 입장하기
          </Link>
        </div>
      </div>
    </main>
  )
}
