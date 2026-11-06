import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer-core'

// Injected into the HTML snapshot before PDF rendering:
// - forces every .slide to become its own PDF page
// - hides navigation UI
const PRINT_CSS = `
  <style id="__pdf_print__">
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #000 !important;
    }
    .nav-bar, #btn-prev, #btn-next, [class*="nav"], .pdf-download-bar {
      display: none !important;
    }
    .slide {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      width: 1280px !important;
      height: 720px !important;
      page-break-after: always !important;
      break-after: page !important;
      overflow: hidden !important;
    }
    @page {
      size: 1280px 720px landscape;
      margin: 0;
    }
  </style>
`

function chromiumPath(): string {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  // Local Mac dev fallback
  return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    select: { htmlSnapshot: true, name: true, slug: true },
  })

  if (!proposal) {
    return new NextResponse('Proposta não encontrada.', { status: 404 })
  }

  // Inject print CSS into the snapshot
  let html = proposal.htmlSnapshot
  html = html.replace('</head>', `${PRINT_CSS}</head>`)

  const browser = await puppeteer.launch({
    executablePath: chromiumPath(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 })

    // Wait for fonts to load and give JS time to settle
    await page.evaluate(
      () => document.fonts.ready.then(() => new Promise<void>((r) => setTimeout(r, 600)))
    )

    const pdfBuffer = await page.pdf({
      width: '1280px',
      height: '720px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    const filename = `proposta-${proposal.slug}.pdf`

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } finally {
    await browser.close()
  }
}
