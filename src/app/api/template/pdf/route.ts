import { NextRequest, NextResponse } from 'next/server'
import { generateGenericSnapshot } from '@/lib/template'
import puppeteer from 'puppeteer-core'
import { PDFDocument } from 'pdf-lib'
import { existsSync } from 'fs'

const HIDE_UI_CSS = `<style id="__pdf__">
  .nav-bar,.pdf-download-bar,#btn-prev,#btn-next,.nav-dots,.progress-bar{display:none!important;}
  .slide{transition:none!important;}
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

export async function GET(req: NextRequest) {
  const base = publicBaseUrl(req)
  let html = await generateGenericSnapshot()
  html = html
    .replace(/\/(projecto-de-vida\/template\/assets\/)/g, `${base}/$1`)
    .replace('</head>', `${HIDE_UI_CSS}</head>`)

  const execPath = chromiumPath()
  console.log('[pdf:generic] chromium:', execPath, '| base:', base)

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'load', timeout: 30_000 })
    await page.evaluate(() =>
      document.fonts.ready.then(() => new Promise<void>((r) => setTimeout(r, 1000)))
    )

    // Force all lazy images to load before screenshotting
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach((img) => {
        (img as HTMLImageElement).loading = 'eager'
      })
    })
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r() })
        )
      )
    )

    // Trigger last-slide background (loaded lazily via JS on goTo last)
    await page.evaluate(() =>
      new Promise<void>((resolve) => {
        const slides = document.querySelectorAll('.slide')
        const lastSlide = slides[slides.length - 1] as HTMLElement | null
        if (!lastSlide) { resolve(); return }
        const img = new Image()
        img.onload = () => { lastSlide.classList.add('bg-loaded'); resolve() }
        img.onerror = () => { lastSlide.classList.add('bg-loaded'); resolve() }
        img.src = 'assets/slide9-bg.jpg'
      })
    )

    const slideCount = await page.evaluate(() =>
      document.querySelectorAll('.slide').length
    )
    console.log('[pdf:generic] slides:', slideCount)

    const screenshots: Buffer[] = []
    for (let i = 0; i < slideCount; i++) {
      await page.evaluate((idx) => {
        document.querySelectorAll('.slide').forEach((s, j) => {
          const el = s as HTMLElement
          el.style.opacity = j === idx ? '1' : '0'
          el.style.pointerEvents = j === idx ? 'auto' : 'none'
        })
      }, i)
      await new Promise((r) => setTimeout(r, 300))
      const shot = await page.screenshot({
        type: 'jpeg',
        quality: 92,
        clip: { x: 0, y: 0, width: 1280, height: 720 },
      })
      screenshots.push(Buffer.from(shot))
    }

    const pdf = await PDFDocument.create()
    for (const shot of screenshots) {
      const img = await pdf.embedJpg(shot)
      const page_ = pdf.addPage([1280, 720])
      page_.drawImage(img, { x: 0, y: 0, width: 1280, height: 720 })
    }

    const pdfBytes = await pdf.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="projecto-de-vida.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[pdf:generic] erro:', err)
    throw err
  } finally {
    await browser.close()
  }
}
