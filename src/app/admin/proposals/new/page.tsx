import { prisma } from '@/lib/prisma'
import { generateSnapshot } from '@/lib/template'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import path from 'path'
import fs from 'fs/promises'
import ProposalForm from './ProposalForm'

export const dynamic = 'force-dynamic'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function createProposal(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const templateId = formData.get('templateId') as string
  const logoFile = formData.get('logo') as File

  if (!name || !slug || !templateId || !logoFile || logoFile.size === 0) {
    throw new Error('Todos os campos são obrigatórios.')
  }

  // Save logo to public/uploads
  const ext = path.extname(logoFile.name) || '.png'
  const filename = `${Date.now()}-${toSlug(name)}${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, filename)
  const buffer = Buffer.from(await logoFile.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  const logoPath = `/uploads/${filename}`

  const template = await prisma.template.findUnique({ where: { id: templateId } })
  if (!template) throw new Error('Template não encontrado.')

  const htmlSnapshot = await generateSnapshot(template.slug, name, logoPath)

  await prisma.proposal.create({
    data: { name, slug, logoPath, htmlSnapshot, templateId },
  })

  revalidatePath('/admin')
  redirect('/admin')
}

export default async function NewProposalPage() {
  const templates = await prisma.template.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Proposta</h1>

      {templates.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
          Crie um template primeiro em{' '}
          <a href="/admin/templates" className="underline font-medium">
            Templates
          </a>{' '}
          antes de criar uma proposta.
        </div>
      )}

      <form action={createProposal} encType="multipart/form-data">
        <ProposalForm templates={templates} />
      </form>
    </div>
  )
}
