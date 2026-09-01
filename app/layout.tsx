import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NEXORA — Social discovery, rewards & mining',
  description: 'A trust-first social discovery platform with verified opportunities and a virtual mining game.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
