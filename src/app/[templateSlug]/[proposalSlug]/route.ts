import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PDF_BAR = (id: string) => `
<div class="pdf-download-bar" style="
  position:fixed; bottom:20px; right:20px; z-index:9999;
  display:flex; align-items:center; gap:8px;
">
  <a href="/api/proposals/${id}/pdf"
     style="
       display:inline-flex; align-items:center; gap:6px;
       background:rgba(10,31,107,0.92); color:#fff;
       font-family:system-ui,sans-serif; font-size:13px; font-weight:600;
       padding:9px 16px; border-radius:8px;
       text-decoration:none; letter-spacing:0.03em;
       backdrop-filter:blur(8px);
       box-shadow:0 2px 12px rgba(0,0,0,0.35);
       transition:opacity .15s;
     "
     onmouseover="this.style.opacity='.85'"
     onmouseout="this.style.opacity='1'"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Baixar PDF
  </a>
</div>`

export async function GET(
  _req: NextRequest,
  { params }: { params: { templateSlug: string; proposalSlug: string } }
) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      slug: params.proposalSlug,
      template: { slug: params.templateSlug },
    },
    select: { id: true, htmlSnapshot: true },
  })

  if (!proposal) {
    return new NextResponse('Proposta não encontrada.', { status: 404 })
  }

  const html = proposal.htmlSnapshot.replace('</body>', `${PDF_BAR(proposal.id)}</body>`)

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
