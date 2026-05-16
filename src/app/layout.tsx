import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpotHunt',
  description: '위치 기반 이벤트 보물찾기 앱',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-screen bg-background text-on-surface antialiased">{children}</body>
    </html>
  )
}
