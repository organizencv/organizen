
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DashboardContent } from '@/components/dashboard-content';

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.companyId) {
    return <div>Error: Session not found</div>;
  }

  const companyId = session.user.companyId;
  const userRole = session.user.role;

  // Fetch dashboard statistics
  const [totalUsers, totalShifts, totalTasks, pendingTasks] = await Promise.all([
    prisma.user.count({
      where: { companyId }
    }),
    prisma.shift.count({
      where: { companyId }
    }),
    prisma.task.count({
      where: { companyId }
    }),
    prisma.task.count({
      where: { 
        companyId,
        status: 'PENDING'
      }
    })
  ]);

  return (
    <DashboardContent
      stats={{
        totalUsers,
        totalShifts,
        totalTasks,
        pendingTasks
      }}
      userRole={userRole}
      userName={session.user.name || 'Utilizador'}
    />
  );
}
