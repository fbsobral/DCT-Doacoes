import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PDF_BAR = (id: string) => `
<div class="pdf-download-bar" style="position:fixed;bottom:20px;right:20px;z-index:9999;">
  <button id="__pdf_btn__"
    onclick="(function(btn){
      if(btn.dataset.loading)return;
      btn.dataset.loading='1';
      btn.innerHTML='<svg width=\\'14\\'height=\\'14\\'viewBox=\\'0 0 24 24\\'fill=\\'none\\'stroke=\\'currentColor\\'stroke-width=\\'2.5\\'stroke-linecap=\\'round\\'><path d=\\'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83\\'><animateTransform attributeName=\\'transform\\'type=\\'rotate\\'from=\\'0 12 12\\'to=\\'360 12 12\\'dur=\\'1s\\'repeatCount=\\'indefinite\\'/></path></svg>Baixando…';
      btn.style.opacity='0.75';btn.style.cursor='wait';
      window.location.href='/api/proposals/${id}/pdf';
      setTimeout(function(){
        delete btn.dataset.loading;
        btn.innerHTML='<svg width=\\'15\\'height=\\'15\\'viewBox=\\'0 0 24 24\\'fill=\\'none\\'stroke=\\'currentColor\\'stroke-width=\\'2.2\\'stroke-linecap=\\'round\\'stroke-linejoin=\\'round\\'><path d=\\'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\\'/><polyline points=\\'7 10 12 15 17 10\\'/><line x1=\\'12\\'y1=\\'15\\'x2=\\'12\\'y2=\\'3\\'/></svg>Baixar PDF';
        btn.style.opacity='1';btn.style.cursor='pointer';
      },20000);
    })(this)"
    style="
      display:inline-flex;align-items:center;gap:6px;
      background:rgba(10,31,107,0.92);color:#fff;
      font-family:system-ui,sans-serif;font-size:13px;font-weight:600;
      padding:9px 16px;border-radius:8px;border:none;cursor:pointer;
      letter-spacing:0.03em;backdrop-filter:blur(8px);
      box-shadow:0 2px 12px rgba(0,0,0,0.35);transition:opacity .15s;
    "
    onmouseover="if(!this.dataset.loading)this.style.opacity='.85'"
    onmouseout="if(!this.dataset.loading)this.style.opacity='1'"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Baixar PDF
  </button>
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
    },
  })
}
