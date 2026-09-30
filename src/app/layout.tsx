import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'DCT Admin',
  description: 'Proposal management for DCT Youths',
}

const devBypass = process.env.DEV_AUTH_BYPASS === 'true'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (devBypass) {
    return (
      <html lang="pt">
        <body>{children}</body>
      </html>
    )
  }
  return (
    <ClerkProvider>
      <html lang="pt">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
