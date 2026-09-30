import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function createTemplate(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  await prisma.template.create({ data: { name, slug } })
  revalidatePath('/admin/templates')
}

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    include: { _count: { select: { proposals: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Templates</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create form */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Novo Template</h2>
          <form action={createTemplate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Projecto de Vida 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B]"
              />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                placeholder="projecto-de-vida"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0A1F6B] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#0d2880] transition-colors"
            >
              Criar Template
            </button>
          </form>
        </div>

        {/* Templates list */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Templates existentes</h2>
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum template criado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">/{t.slug}</p>
                  </div>
                  <span className="text-xs text-gray-400">{t._count.proposals} proposta(s)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
