import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Topographical pattern overlay */}
      <div className="fixed inset-0 -z-10 topo-bg" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-12 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <div className="font-headline text-2xl font-extrabold text-primary tracking-tighter">SpotHunt</div>
        <div className="bg-surface-container-high px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>workspace_premium</span>
          <span className="text-xs font-semibold text-primary font-label">XP: 0</span>
        </div>
      </header>

      {/* Main */}
      <main className="pt-24 pb-32 px-5 flex flex-col items-center">
        {/* Hero */}
        <section className="max-w-[480px] w-full text-center mb-12">
          <div className="mb-6 inline-flex items-center justify-center p-4 bg-primary-container rounded-3xl border-4 border-primary shadow-[0_0_24px_rgba(255,183,125,0.35)]">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontSize: 48 }}>explore</span>
          </div>
          <h1
            className="font-headline text-5xl font-extrabold text-primary mb-4"
            style={{ letterSpacing: '-0.02em', lineHeight: 1.1 }}
          >
            SpotHunt
          </h1>
          <p className="text-xl font-bold text-on-surface-variant leading-tight mb-8 font-headline">
            위치 기반 이벤트 보물찾기
          </p>

          <div className="flex flex-col gap-4 w-full px-4">
            <Link
              href="/host/create"
              className="h-12 bg-primary-container text-on-primary-container font-headline text-lg font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              <span className="material-symbols-outlined">add_circle</span>
              주최자로 시작하기
            </Link>
            <Link
              href="/join"
              className="h-12 border-2 border-primary text-primary font-headline text-lg font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">group</span>
              참여자로 입장하기
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-[480px] w-full">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-px flex-grow bg-white/10" />
            <h2 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-[0.2em]">이용 방법</h2>
            <span className="h-px flex-grow bg-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="glass-card p-4 rounded-xl flex items-start gap-4 border-l-4 border-l-primary">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">meeting_room</span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-primary mb-1">방 만들기 / 찾기</h3>
                <p className="text-sm text-on-surface-variant">이벤트 방을 만들거나, 주변의 방에 참여하세요.</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl flex items-start gap-4 border-l-4 border-l-tertiary">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">map</span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-tertiary mb-1">지도 탐험</h3>
                <p className="text-sm text-on-surface-variant">이벤트 구역을 탐험하며 숨겨진 아이템을 발견하세요.</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl flex items-start gap-4 border-l-4 border-l-on-secondary-container">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container">trophy</span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-on-secondary-container mb-1">보상 획득</h3>
                <p className="text-sm text-on-surface-variant">아이템을 수집하고 점수판 상위에 올라보세요!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Map preview */}
        <section className="max-w-[480px] w-full mt-12 rounded-2xl overflow-hidden glass-card h-48 relative border border-white/20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,183,125,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,183,125,0.06) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Fake markers */}
          <div className="absolute top-[35%] left-[25%] w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/60 shadow-md">
            <span className="text-base">🏆</span>
          </div>
          <div className="absolute top-[55%] left-[65%] w-10 h-10 bg-tertiary/20 rounded-full flex items-center justify-center border-2 border-tertiary/60 shadow-md animate-bounce">
            <span className="text-lg">💎</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full border border-surface bg-primary" />
              <div className="w-5 h-5 rounded-full border border-surface bg-tertiary" />
              <div className="w-5 h-5 rounded-full border border-surface bg-secondary" />
            </div>
            <span className="text-xs font-semibold text-on-surface">실시간 참여자 대기 중</span>
          </div>
        </section>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-5 pb-2 h-16 bg-surface-container/90 backdrop-blur-lg border-t border-white/10 rounded-t-xl shadow-lg">
        <div className="flex flex-col items-center justify-center text-primary font-bold border-t-2 border-primary pt-2">
          <span className="material-symbols-outlined">map</span>
          <span className="text-[11px] font-semibold">지도</span>
        </div>
        <Link href="/join" className="flex flex-col items-center justify-center text-on-surface-variant pt-2 hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[11px] font-semibold">점수판</span>
        </Link>
        <Link href="/host/create" className="flex flex-col items-center justify-center text-on-surface-variant pt-2 hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[11px] font-semibold">로비</span>
        </Link>
      </nav>
    </div>
  )
}
