import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-shrink-0 bg-[#0A1F6B] text-white flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-lg font-bold tracking-wide">DCT Admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/admin" className="block px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            Propostas
          </Link>
          <Link href="/admin/templates" className="block px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            Templates
          </Link>
        </nav>
        <div className="px-6 py-4 border-t border-white/10">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>
      <main className="flex-1 bg-white overflow-auto">
        {children}
      </main>
    </div>
  )
}
