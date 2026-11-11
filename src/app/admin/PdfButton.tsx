'use client'

import { useState } from 'react'

export default function PdfButton({ id, slug }: { id: string; slug: string }) {
  const [loading, setLoading] = useState(false)

  function download() {
    if (loading) return
    setLoading(true)
    window.location.href = `/api/proposals/${id}/pdf`
    setTimeout(() => setLoading(false), 20000)
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
