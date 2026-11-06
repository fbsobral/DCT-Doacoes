'use client'

import { useState } from 'react'

export default function PdfButton({ id, slug }: { id: string; slug: string }) {
  const [loading, setLoading] = useState(false)

  async function download() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/proposals/${id}/pdf`)
      if (!res.ok) throw new Error('Erro ao gerar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `proposta-${slug}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={download}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded border border-green-300 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      {loading ? 'Baixando…' : 'PDF'}
    </button>
  )
}
