import { prisma } from '@/lib/prisma'
import { generateSnapshot } from '@/lib/template'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function updateLogo(id: string, formData: FormData) {
  'use server'
  const logoFile = formData.get('logo') as File
  if (!logoFile || logoFile.size === 0) redirect(`/admin/proposals/${id}/edit`)

  const buffer = Buffer.from(await logoFile.arrayBuffer())
  const mimeType = logoFile.type || 'image/png'
  const logoPath = `data:${mimeType};base64,${buffer.toString('base64')}`

  const proposal = await prisma.proposal.update({
    where: { id },
    data: { logoPath },
    include: { template: true },
  })

  const htmlSnapshot = await generateSnapshot(proposal.template.slug, proposal.name, logoPath)
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

  const action = updateLogo.bind(null, params.id)

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Editar Proposta</h1>
      <p className="text-gray-500 text-sm mb-6">{proposal.name}</p>

      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Logo atual</p>
        <img src={proposal.logoPath} alt={proposal.name} className="h-16 object-contain" />
      </div>

      <form action={action} encType="multipart/form-data" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nova logo
          </label>
          <input
            type="file"
            name="logo"
            accept="image/*"
            required
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#0A1F6B] file:text-white hover:file:bg-[#0d2880]"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-[#0A1F6B] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#0d2880] transition-colors"
          >
            Salvar e regenerar
          </button>
          <a
            href="/admin"
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
