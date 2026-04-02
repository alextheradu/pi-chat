import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') redirect('/')
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {children}
      </main>
    </div>
  )
}
