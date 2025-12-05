
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';

    const companyId = session.user.companyId;

    // Calcular data inicial
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Buscar produtividade por usuário
    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        assignedTasks: {
          where: {
            createdAt: {
              gte: startDate
            }
          },
          select: {
            status: true
          }
        },
        sentMessages: {
          where: {
            createdAt: {
              gte: startDate
            },
            deleted: false
          }
        },
        assignedShifts: {
          where: {
            createdAt: {
              gte: startDate
            }
          }
        }
      }
    });

    const productivity = users.map((user: any) => {
      const totalTasks = user.assignedTasks.length;
      const completedTasks = user.assignedTasks.filter((t: any) => t.status === 'COMPLETED').length;
      const messagesSent = user.sentMessages.length;
      const shiftsCompleted = user.assignedShifts.length;

      return {
        name: user.name || user.email,
        totalTasks,
        completedTasks,
        messagesSent,
        shiftsCompleted,
        completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
      };
    }).sort((a: any, b: any) => b.completedTasks - a.completedTasks).slice(0, 10);

    return NextResponse.json({ productivity });

  } catch (error) {
    console.error('User productivity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
