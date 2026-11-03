const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const

const MAGIC: Record<string, string> = {
  'ffd8ff': 'image/jpeg',
  '89504e47': 'image/png',
  '47494638': 'image/gif',
  '52494646': 'image/webp', // RIFF....WEBP
}

function detectMime(buf: Buffer): string | null {
  const hex4 = buf.subarray(0, 4).toString('hex')
  if (MAGIC[hex4]) return MAGIC[hex4]
  const hex3 = buf.subarray(0, 3).toString('hex')
  if (MAGIC[hex3]) return MAGIC[hex3]
  // WEBP: bytes 8-11 are 'WEBP'
  if (buf.length >= 12 && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return null
}

export async function logoToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('Logo muito grande. Tamanho máximo: 2 MB.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mime = detectMime(buffer)

  if (!mime || !(ALLOWED_MIME as readonly string[]).includes(mime)) {
    throw new Error('Formato inválido. Use PNG, JPEG, GIF ou WebP.')
  }

  return `data:${mime};base64,${buffer.toString('base64')}`
}
