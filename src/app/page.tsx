import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-10 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-kp">
            <span className="text-3xl">🗺️</span>
          </div>
          <div>
            <h1
              className="font-display text-[42px] font-bold text-knear"
              style={{ letterSpacing: '-1px', lineHeight: 1.17 }}
            >
              SpotHunt
            </h1>
            <p className="mt-2 text-base text-kgray-light">위치 기반 이벤트 보물찾기</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/host/create"
            className="block w-full rounded-xl bg-kp px-4 py-[13px] text-center text-base font-semibold text-white transition-colors hover:bg-kp-dark active:bg-kp-deep"
          >
            주최자로 시작하기
          </Link>
          <Link
            href="/join"
            className="block w-full rounded-xl border border-kp-dark bg-white px-4 py-[13px] text-center text-base font-semibold text-kp-dark transition-colors hover:bg-kp-faint active:bg-kp-subtle"
          >
            참여자로 입장하기
          </Link>
        </div>
      </div>
    </main>
  )
}
