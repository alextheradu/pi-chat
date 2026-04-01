import { prisma } from '@/lib/prisma'
import { MembersTable } from '@/components/admin/MembersTable'

export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subdivisionMembers: { include: { subdivision: true } } },
  })
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Members</h1>
      <MembersTable members={members} />
    </div>
  )
}
