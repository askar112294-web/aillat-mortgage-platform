import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ailat Finance — Исламская ипотека',
  description: 'Предварительный расчет исламского финансирования и выбор недвижимости у партнеров Ailat Finance.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
