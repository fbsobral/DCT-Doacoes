'use client'

import { useState } from 'react'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ProposalForm({
  templates,
}: {
  templates: { id: string; name: string; slug: string }[]
}) {
  const [slugEdited, setSlugEdited] = useState(false)
  const [slug, setSlug] = useState('')

  return (
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
          placeholder="Fundação Exemplo"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B]"
          onChange={(e) => {
            if (!slugEdited) setSlug(toSlug(e.target.value))
          }}
        />
      </div>

      <div>
        <label htmlFor="artigo" className="block text-sm font-medium text-gray-700 mb-1">
          Artigo
        </label>
        <select
          id="artigo"
          name="artigo"
          required
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
        <input
          id="logo"
          name="logo"
          type="file"
          required
          accept="image/*"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>

      <div>
        <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-1">
          Template
        </label>
        <select
          id="templateId"
          name="templateId"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B] bg-white"
        >
          <option value="">Selecione um template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (/{t.slug})
            </option>
          ))}
        </select>
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
          value={slug}
          placeholder="fundacao-exemplo"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F6B]"
          onChange={(e) => {
            setSlugEdited(true)
            setSlug(e.target.value)
          }}
        />
        <p className="mt-1 text-xs text-gray-500">
          URL pública: /{'{templateSlug}'}/{slug || '{slug}'}/
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="bg-[#0A1F6B] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#0d2880] transition-colors"
        >
          Criar Proposta
        </button>
        <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Cancelar
        </a>
      </div>
    </div>
  )
}
