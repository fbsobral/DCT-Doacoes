import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer-core'

// Injected via page.evaluate() after the page loads.
// Re-arranges the fixed/absolute slide deck into a vertical stack
// suitable for multi-page PDF printing.
const PREPARE_FOR_PDF = `
  // Hide nav and download button
  document.querySelectorAll('.nav-bar, .pdf-download-bar').forEach(el => el.remove())

  // Unlock the body/html from overflow:hidden
  document.documentElement.style.cssText = 'margin:0;padding:0;background:#000;overflow:visible;height:auto;'
  document.body.style.cssText = 'margin:0;padding:0;background:#000;overflow:visible;height:auto;'

  // Convert the fixed deck into a simple block
  const deck = document.querySelector('.deck')
  if (deck) {
    deck.style.cssText = 'position:static;display:block;background:#000;'
  }

  // Make every slide visible and stacked vertically
  const slides = document.querySelectorAll('.slide')
  slides.forEach((slide, i) => {
    slide.classList.add('active')
    const isLast = i === slides.length - 1
    slide.style.cssText = [
      'position:relative',
      'inset:auto',
      'opacity:1',
      'pointer-events:auto',
      'display:flex',
      'flex-direction:column',
      'width:1280px',
      'height:720px',
      'overflow:hidden',
      'flex-shrink:0',
      isLast ? '' : 'page-break-after:always',
      isLast ? '' : 'break-after:page',
    ].filter(Boolean).join(';')
  })
`

function chromiumPath(): string {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

function appBaseUrl(): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '')
  return 'http://localhost:3000'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    select: { slug: true, name: true, template: { select: { slug: true } } },
  })

  if (!proposal) {
    return new NextResponse('Proposta não encontrada.', { status: 404 })
  }

  const url = `${appBaseUrl()}/${proposal.template.slug}/${proposal.slug}/`

  const browser = await puppeteer.launch({
    executablePath: chromiumPath(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.5 })

    // networkidle2 waits for Google Fonts woff2 files to finish downloading
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45_000 })

    // Wait for all fonts to be parsed and ready
    await page.evaluate(() =>
      document.fonts.ready.then(() => new Promise<void>((r) => setTimeout(r, 400)))
    )

    // Re-layout slides for PDF
    await page.evaluate(PREPARE_FOR_PDF)

    // Another tick to let reflows settle
    await page.evaluate(() => new Promise<void>((r) => setTimeout(r, 300)))

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
