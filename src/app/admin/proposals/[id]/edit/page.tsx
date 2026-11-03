import { prisma } from '@/lib/prisma'
import { generateSnapshot } from '@/lib/template'
import { logoToDataUrl } from '@/lib/logo'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function updateProposal(id: string, formData: FormData) {
  'use server'
  const name = (formData.get('name') as string).trim()
  const slug = toSlug((formData.get('slug') as string).trim())
  const artigo = (formData.get('artigo') as string) || 'A'
  const logoFile = formData.get('logo') as File

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: { template: true },
  })
  if (!proposal) redirect('/admin')

  let logoPath = proposal.logoPath
  if (logoFile && logoFile.size > 0) {
    logoPath = await logoToDataUrl(logoFile)
  }

  await prisma.proposal.update({ where: { id }, data: { name, slug, artigo, logoPath } })

  const htmlSnapshot = await generateSnapshot(proposal.template.slug, name, logoPath, artigo)
  await prisma.proposal.update({ where: { id }, data: { htmlSnapshot } })

  revalidatePath('/admin')
  redirect('/admin')
}

export default async function EditProposalPage({ params }: { params: { id: string } }) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: { template: true },
  })
  if (!proposal) notFound()

  const action = updateProposal.bind(null, params.id)

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Proposta</h1>

      <form action={action} encType="multipart/form-data">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Doador
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={proposal.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B]"
            />
          </div>

          <div>
            <label htmlFor="artigo" className="block text-sm font-medium text-gray-700 mb-1">
              Artigo
            </label>
            <select
              id="artigo"
              name="artigo"
              defaultValue={proposal.artigo}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B] bg-white"
            >
              <option value="A">A — feminino (ex: A Empresa X)</option>
              <option value="O">O — masculino (ex: O Instituto Y)</option>
            </select>
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
              Logo do Doador
            </label>
            {proposal.logoPath && (
              <img src={proposal.logoPath} alt={proposal.name} className="h-10 object-contain mb-2" />
            )}
            <input
              id="logo"
              type="file"
              name="logo"
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="mt-1 text-xs text-gray-500">Deixe em branco para manter a logo atual.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <input
              type="text"
              disabled
              value={proposal.template.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
              Slug da Proposta
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              defaultValue={proposal.slug}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B]"
            />
            <p className="mt-1 text-xs text-gray-500">
              URL pública: /{proposal.template.slug}/{proposal.slug}/
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#0A1F6B] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#0d2880] transition-colors"
            >
              Salvar e regenerar
            </button>
            <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancelar
            </a>
          </div>
        </div>
      </form>
    </div>
  )
}
