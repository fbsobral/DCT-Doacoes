import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

const devBypass = process.env.DEV_AUTH_BYPASS === 'true'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!devBypass) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.proposal.delete({ where: { id: params.id } })

  return NextResponse.redirect(new URL('/admin', req.url))
}
