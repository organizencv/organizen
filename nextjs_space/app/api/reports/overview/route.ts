
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const companyId = session.user.companyId;

    // Calcular datas baseado no período
    let dateFilter: any = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      switch (period) {
        case 'today':
          const todayStart = new Date(now.setHours(0, 0, 0, 0));
          dateFilter = { gte: todayStart };
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - 7);
          dateFilter = { gte: weekStart };
          break;
        case 'month':
          const monthStart = new Date(now);
          monthStart.setMonth(monthStart.getMonth() - 1);
          dateFilter = { gte: monthStart };
          break;
        case 'year':
          const yearStart = new Date(now);
          yearStart.setFullYear(yearStart.getFullYear() - 1);
          dateFilter = { gte: yearStart };
          break;
      }
    }

    // Buscar estatísticas gerais
    const [
      totalUsers,
      totalTasks,
      totalMessages,
      totalShifts,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      readMessages,
      unreadMessages
    ] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.task.count({ 
        where: { 
          companyId,
          createdAt: dateFilter 
        } 
      }),
      prisma.message.count({ 
        where: { 
          companyId,
          deleted: false,
          createdAt: dateFilter 
        } 
      }),
      prisma.shift.count({ 
        where: { 
          companyId,
          createdAt: dateFilter 
        } 
      }),
      prisma.task.count({ 
        where: { 
          companyId,
          status: 'COMPLETED',
          createdAt: dateFilter 
        } 
      }),
      prisma.task.count({ 
        where: { 
          companyId,
          status: 'PENDING',
          createdAt: dateFilter 
        } 
      }),
      prisma.task.count({ 
        where: { 
          companyId,
          status: 'IN_PROGRESS',
          createdAt: dateFilter 
        } 
      }),
      prisma.message.count({ 
        where: { 
          companyId,
          read: true,
          deleted: false,
          createdAt: dateFilter 
        } 
      }),
      prisma.message.count({ 
        where: { 
          companyId,
          read: false,
          deleted: false,
          createdAt: dateFilter 
        } 
      })
    ]);

    // Taxa de conclusão de tarefas
    const completionRate = totalTasks > 0 
      ? ((completedTasks / totalTasks) * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      period,
      overview: {
        totalUsers,
        totalTasks,
        totalMessages,
        totalShifts,
        completionRate
      },
      tasks: {
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks
      },
      messages: {
        read: readMessages,
        unread: unreadMessages
      }
    });

  } catch (error) {
    console.error('Reports overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
