import fs from 'fs/promises'
import path from 'path'

export async function generateSnapshot(
  templateSlug: string,
  donorName: string,
  logoPath: string
): Promise<string> {
  const templatePath = path.join(process.cwd(), 'projecto-de-vida', 'template', 'index.html')
  let html = await fs.readFile(templatePath, 'utf-8')

  // Fix relative asset paths → absolute so they resolve from any URL
  // The template lives at /projecto-de-vida/template/, so assets/ → /projecto-de-vida/template/assets/
  html = html.replace(/(src|href)="assets\//g, '$1="/projecto-de-vida/template/assets/')

  // Donor overlay injected right after the first slide's opening tag
  const overlay = `<div style="position:absolute; top:16px; right:clamp(28px,5vw,60px); z-index:100; display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.12); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:8px 14px;">
  <img src="${logoPath}" alt="${donorName}" style="height:32px; width:auto; object-fit:contain; display:block;">
  <div style="font-size:11px; font-weight:600; color:rgba(255,255,255,0.85); letter-spacing:0.08em; text-transform:uppercase;">Proposta para ${donorName}</div>
</div>`

  html = html.replace(
    /(<div[^>]*class="[^"]*\bslide-1\b[^"]*"[^>]*>)/,
    `$1\n${overlay}`
  )

  return html
}
