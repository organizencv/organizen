
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// Get subtasks for a task
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID required' }, { status: 400 });
    }

    const subtasks = await prisma.task.findMany({
      where: { parentId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error('Subtasks GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a subtask
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, dueDate, status, userId, parentId } = await request.json();

    if (!title || !parentId) {
      return NextResponse.json({ error: 'Title and parentId required' }, { status: 400 });
    }

    // Verificar se a tarefa pai está concluída
    const parentTask = await prisma.task.findUnique({
      where: { id: parentId },
      select: { status: true }
    });

    if (!parentTask) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 });
    }

    if (parentTask.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Cannot create subtasks for completed tasks',
        message: 'Não é possível criar subtarefas numa tarefa já concluída'
      }, { status: 400 });
    }

    const assignedUserId = userId || session.user.id;
    
    const subtask = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'PENDING',
        userId: assignedUserId,
        companyId: session.user.companyId,
        parentId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json(subtask);
  } catch (error) {
    console.error('Subtask creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
