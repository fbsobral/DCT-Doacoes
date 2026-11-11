import { NextResponse } from 'next/server'
import { generateGenericSnapshot } from '@/lib/template'

export async function GET() {
  const html = await generateGenericSnapshot()

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': [
        "default-src 'self'",
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "connect-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
      ].join('; '),
    },
  })
}
