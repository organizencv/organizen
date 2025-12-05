
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UsersContent } from '@/components/users-content';

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/dashboard');
  }

  const companyId = session.user.companyId;

  // Fetch users, departments, and teams
  const [users, departments, teams] = await Promise.all([
    prisma.user.findMany({
      where: { companyId },
      include: {
        department: true,
        team: true,
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.department.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    }),
    prisma.team.findMany({
      where: { department: { companyId } },
      include: { department: true },
      orderBy: { name: 'asc' }
    })
  ]);

  // Convert dates to strings for client components
  const serializedUsers = users.map((user: any) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    department: user.department ? {
      id: user.department.id,
      name: user.department.name
    } : null
  }));

  return (
    <UsersContent 
      users={serializedUsers} 
      departments={departments}
      teams={teams}
      userRole={session.user.role}
    />
  );
}
