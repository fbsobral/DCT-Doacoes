import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { templateSlug: string; proposalSlug: string } }
) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      slug: params.proposalSlug,
      template: { slug: params.templateSlug },
    },
    select: { htmlSnapshot: true },
  })

  if (!proposal) {
    return new NextResponse('Proposta não encontrada.', { status: 404 })
  }

  return new NextResponse(proposal.htmlSnapshot, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
