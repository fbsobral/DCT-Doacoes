import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSnapshot } from '@/lib/template'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: { template: true },
  })

  if (!proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })
  }

  const htmlSnapshot = await generateSnapshot(
    proposal.template.slug,
    proposal.name,
    proposal.logoPath
  )

  await prisma.proposal.update({
    where: { id: params.id },
    data: { htmlSnapshot },
  })

  return NextResponse.redirect(new URL('/admin', _req.url))
}
