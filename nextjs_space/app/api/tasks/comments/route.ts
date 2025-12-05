
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyTaskComment } from '@/lib/notification-triggers';

export const dynamic = "force-dynamic";

// Get comments for a task
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, taskId } = await request.json();

    if (!content || !taskId) {
      return NextResponse.json({ error: 'Content and taskId required' }, { status: 400 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        content,
        taskId,
        userId: session.user.id
      }
    });

    // Buscar informações da tarefa para notificação
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        userId: true
      }
    });

    // Enviar notificação se o comentário foi feito por outra pessoa
    if (task && task.userId !== session.user.id) {
      notifyTaskComment({
        taskOwnerId: task.userId,
        commentAuthorName: session.user.name || 'Usuário',
        taskId,
        taskTitle: task.title,
        commentText: content
      }).catch(err => console.error('Error sending comment notification:', err));
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
