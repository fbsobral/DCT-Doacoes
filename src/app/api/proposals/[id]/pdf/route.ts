import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'

const PRINT_CSS = `<style id="__pdf__">
  @page{size:13.333in 7.5in landscape;margin:0;}
  html,body{margin:0;padding:0;background:transparent;overflow:visible;height:auto;width:1280px;}
  .nav-bar,.pdf-download-bar,#btn-prev,#btn-next,.nav-dots,.progress-bar{display:none!important;}
  .deck{position:static!important;display:block!important;height:auto!important;overflow:visible!important;width:1280px!important;}
  .slide{
    position:relative!important;inset:auto!important;
    opacity:1!important;pointer-events:auto!important;
    display:flex!important;flex-direction:column!important;
    width:1280px!important;height:720px!important;
    overflow:hidden!important;flex-shrink:0!important;
  }
  .slide:not(:last-child){page-break-after:always!important;break-after:page!important;}
</style>`

function chromiumPath(): string {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  for (const p of ['/usr/bin/chromium-browser', '/usr/bin/chromium']) {
    if (existsSync(p)) return p
  }
  return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

function publicBaseUrl(req: NextRequest): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '')
  const host = req.headers.get('host') ?? 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  return `${proto}://${host}`
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    select: { slug: true, htmlSnapshot: true },
  })

  if (!proposal) {
    return new NextResponse('Proposta não encontrada.', { status: 404 })
  }

  // Replace /path assets with absolute public URLs — no loopback request needed
  const base = publicBaseUrl(req)
  let html = proposal.htmlSnapshot
    .replace(/\/(projecto-de-vida\/template\/assets\/)/g, `${base}/$1`)
    .replace('</head>', `${PRINT_CSS}</head>`)

  const execPath = chromiumPath()
  console.log('[pdf] chromium:', execPath, '| base:', base)

  const browser = await puppeteer.launch({
    executablePath: execPath,
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
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })

    // setContent with absolute asset URLs — no loopback needed
    await page.setContent(html, { waitUntil: 'load', timeout: 30_000 })

    // Wait for fonts and images
    await page.evaluate(() =>
      document.fonts.ready.then(() => new Promise<void>((r) => setTimeout(r, 800)))
    )

    const pdfBuffer = await page.pdf({
      width: '13.333in',
      height: '7.5in',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${proposal.slug}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[pdf] erro:', err)
    throw err
  } finally {
    await browser.close()
  }
}
