'use client'

export default function DeleteButton({ id }: { id: string }) {
  return (
    <form action={`/admin/proposals/${id}/delete`} method="POST">
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm('Tem certeza que deseja eliminar esta proposta?')) {
            e.preventDefault()
          }
        }}
        className="text-xs px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
      >
        Eliminar
      </button>
    </form>
  )
}
