import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const proposals = await prisma.proposal.findMany({
    include: { template: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Propostas</h1>
        <Link
          href="/admin/proposals/new"
          className="bg-[#0A1F6B] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#0d2880] transition-colors"
        >
          Nova Proposta
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Nenhuma proposta criada ainda.</p>
          <p className="text-sm mt-1">Clique em &ldquo;Nova Proposta&rdquo; para começar.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug / URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {proposal.logoPath && (
                        <img
                          src={proposal.logoPath}
                          alt={proposal.name}
                          className="h-8 w-auto object-contain"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900">{proposal.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proposal.template.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`/${proposal.template.slug}/${proposal.slug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      /{proposal.template.slug}/{proposal.slug}/
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/${proposal.template.slug}/${proposal.slug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Ver
                      </a>
                      <form action={`/admin/proposals/${proposal.id}/regenerate`} method="POST">
                        <button
                          type="submit"
                          className="text-xs px-3 py-1.5 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          Regenerar
                        </button>
                      </form>
                      <form action={`/admin/proposals/${proposal.id}/delete`} method="POST">
                        <button
                          type="submit"
                          className="text-xs px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                          onClick={(e) => {
                            if (!confirm('Tem certeza que deseja eliminar esta proposta?')) {
                              e.preventDefault()
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
