
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShiftsContent } from '@/components/shifts-content';

export const dynamic = "force-dynamic";

export default async function ShiftsPage({
  searchParams
}: {
  searchParams: { shiftId?: string }
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const companyId = session.user.companyId;
  const userRole = session.user.role;
  const userId = session.user.id;

  // Fetch shifts based on user role
  let shiftsQuery: any = {
    where: { companyId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: { startTime: 'asc' }
  };

  // Staff can only see their own shifts
  if (userRole === 'STAFF') {
    shiftsQuery.where.userId = userId;
  }

  const [shifts, users] = await Promise.all([
    prisma.shift.findMany(shiftsQuery),
    // Only fetch users for non-staff roles
    userRole !== 'STAFF' ? prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    }) : []
  ]);

  // Convert dates to strings for client components  
  const serializedShifts = shifts.map((shift: any) => ({
    id: shift.id,
    title: shift.title,
    description: shift.description,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime.toISOString(),
    user: (shift as any).user,
  }));

  return (
    <ShiftsContent 
      shifts={serializedShifts} 
      users={users}
      userRole={userRole}
      currentUserId={userId}
      openShiftId={searchParams.shiftId}
    />
  );
}
