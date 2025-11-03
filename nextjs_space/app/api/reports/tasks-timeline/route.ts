
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

    // Buscar tarefas por dia nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await prisma.task.findMany({
      where: {
        companyId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Agrupar por dia
    const tasksByDay: { [key: string]: { completed: number; pending: number; inProgress: number } } = {};
    
    tasks.forEach((task: any) => {
      const date = task.createdAt.toISOString().split('T')[0];
      if (!tasksByDay[date]) {
        tasksByDay[date] = { completed: 0, pending: 0, inProgress: 0 };
      }
      
      if (task.status === 'COMPLETED') tasksByDay[date].completed++;
      else if (task.status === 'PENDING') tasksByDay[date].pending++;
      else if (task.status === 'IN_PROGRESS') tasksByDay[date].inProgress++;
    });

    // Converter para array ordenado
    const timeline = Object.entries(tasksByDay)
      .map(([date, counts]) => ({
        date,
        ...counts
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ timeline });

  } catch (error) {
    console.error('Tasks timeline error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
