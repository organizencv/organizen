
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const includeShifts = searchParams.get('includeShifts') !== 'false';
    const includeTasks = searchParams.get('includeTasks') !== 'false';

    const includeHolidays = searchParams.get('includeHolidays') !== 'false';

    const companyId = session.user.companyId;
    const userRole = session.user.role;
    const userId = session.user.id;

    const calendarItems: any[] = [];

    // Datas de filtro
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setHours(23, 59, 59, 999);

    // Buscar turnos
    if (includeShifts) {
      const shiftsQuery: any = {
        where: {
          companyId,
          startTime: { gte: start },
          endTime: { lte: end }
        }
      };

      if (userRole === 'STAFF') {
        shiftsQuery.where.userId = userId;
      }

      const shifts = await prisma.shift.findMany(shiftsQuery);
      
      calendarItems.push(...shifts.map((shift: any) => ({
        id: shift.id,
        title: shift.title,
        description: shift.description,
        start: shift.startTime,
        end: shift.endTime,
        type: 'shift',
        color: '#10B981'
      })));
    }

    // Buscar tarefas com prazo
    if (includeTasks) {
      const tasksQuery: any = {
        where: {
          companyId,
          dueDate: {
            gte: start,
            lte: end
          }
        }
      };

      if (userRole === 'STAFF') {
        tasksQuery.where.userId = userId;
      }

      const tasks = await prisma.task.findMany(tasksQuery);
      
      calendarItems.push(...tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        start: task.dueDate,
        end: task.dueDate,
        type: 'task',
        color: task.priority === 'URGENT' ? '#EF4444' : 
               task.priority === 'HIGH' ? '#F59E0B' :
               task.priority === 'MEDIUM' ? '#3B82F6' : '#6B7280',
        status: task.status,
        priority: task.priority,
        allDay: true
      })));
    }



    // Buscar feriados
    if (includeHolidays) {
      const holidays = await prisma.companyHoliday.findMany({
        where: {
          companyId,
          date: {
            gte: start,
            lte: end
          }
        },
        orderBy: {
          date: 'asc'
        }
      });
      
      calendarItems.push(...holidays.map((holiday: any) => ({
        id: holiday.id,
        title: holiday.name,
        description: holiday.description,
        start: holiday.date,
        end: holiday.date,
        type: 'holiday',
        color: '#DC2626', // Vermelho para feriados
        isRecurring: holiday.isRecurring,
        allDay: true
      })));
    }

    // Ordenar por data de início
    calendarItems.sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return NextResponse.json({
      items: calendarItems,
      start,
      end
    });

  } catch (error) {
    console.error('Calendar GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
