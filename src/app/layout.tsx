import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpotHunt',
  description: '위치 기반 이벤트 보물찾기 앱',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-knear">{children}</body>
    </html>
  )
}
