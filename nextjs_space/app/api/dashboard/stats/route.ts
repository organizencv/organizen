

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;

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

    return NextResponse.json({
      totalUsers,
      totalShifts,
      totalTasks,
      pendingTasks
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
