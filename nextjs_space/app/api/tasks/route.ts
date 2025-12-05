
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { notifyTaskAssigned } from '@/lib/notification-triggers';

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

    const companyId = session.user.companyId;
    const userRole = session.user.role;
    const userId = session.user.id;

    let tasksQuery: any = {
      where: { 
        companyId,
        parentId: null // Only get main tasks, not subtasks
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        subtasks: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 3 // Get only last 3 comments
        },
        checkItems: {
          orderBy: { order: 'asc' }
        },
        tags: {
          orderBy: { createdAt: 'asc' }
        },
        customTags: {
          include: {
            tag: true
          }
        },
        customStatus: true,
        customPriority: true,
        attachments: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' }
      ]
    };

    // Staff can only see their own tasks
    if (userRole === 'STAFF') {
      tasksQuery.where.userId = userId;
    }

    const tasks = await prisma.task.findMany(tasksQuery);

    return NextResponse.json(tasks);

  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, dueDate, status, userId, priority, customStatusId, customPriorityId, customTagIds, memberIds } = await request.json();

    const assignedUserId = userId || session.user.id;
    
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        userId: assignedUserId,
        companyId: session.user.companyId,
        customStatusId: customStatusId || null,
        customPriorityId: customPriorityId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        subtasks: true,
        comments: true,
        checkItems: true,
        tags: true,
        customTags: {
          include: {
            tag: true
          }
        },
        customStatus: true,
        customPriority: true,
        attachments: true
      }
    });

    // Adicionar custom tags se fornecidas
    if (customTagIds && Array.isArray(customTagIds) && customTagIds.length > 0) {
      await prisma.taskCustomTag.createMany({
        data: customTagIds.map((tagId: string) => ({
          taskId: task.id,
          tagId
        }))
      });
    }

    // Adicionar membros à tarefa se fornecidos
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Adicionar o responsável principal como OWNER
      await prisma.taskMember.create({
        data: {
          taskId: task.id,
          userId: assignedUserId,
          role: 'OWNER'
        }
      });

      // Adicionar os membros adicionais como MEMBER
      await prisma.taskMember.createMany({
        data: memberIds.map((memberId: string) => ({
          taskId: task.id,
          userId: memberId,
          role: 'MEMBER'
        }))
      });
    } else {
      // Se não houver membros adicionais, adicionar apenas o responsável como OWNER
      await prisma.taskMember.create({
        data: {
          taskId: task.id,
          userId: assignedUserId,
          role: 'OWNER'
        }
      });
    }

    // Buscar a tarefa com as tags e membros incluídos
    const taskWithDetails = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, image: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        subtasks: true,
        comments: true,
        checkItems: true,
        tags: true,
        customTags: {
          include: {
            tag: true
          }
        },
        customStatus: true,
        customPriority: true,
        attachments: true
      }
    });

    // Enviar notificação se a tarefa foi atribuída a outro usuário
    if (assignedUserId !== session.user.id) {
      notifyTaskAssigned({
        userId: assignedUserId,
        assignedBy: session.user.id,
        assignedByName: session.user.name || 'Usuário',
        taskId: task.id,
        taskTitle: title,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : undefined
      }).catch(err => console.error('Error sending task notification:', err));
    }

    // Enviar notificações para os membros adicionais
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      for (const memberId of memberIds) {
        if (memberId !== session.user.id && memberId !== assignedUserId) {
          notifyTaskAssigned({
            userId: memberId,
            assignedBy: session.user.id,
            assignedByName: session.user.name || 'Usuário',
            taskId: task.id,
            taskTitle: title,
            priority: priority || 'MEDIUM',
            dueDate: dueDate ? new Date(dueDate) : undefined
          }).catch(err => console.error('Error sending task notification to member:', err));
        }
      }
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/tasks');

    return NextResponse.json(taskWithDetails);

  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
