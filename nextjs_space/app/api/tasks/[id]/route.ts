
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, dueDate, status, userId, priority, customStatusId, customPriorityId, customTagIds } = await request.json();

    const task = await prisma.task.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        userId: userId || session.user.id,
        customStatusId: customStatusId !== undefined ? customStatusId : undefined,
        customPriorityId: customPriorityId !== undefined ? customPriorityId : undefined,
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

    // Atualizar custom tags se fornecidas
    if (customTagIds !== undefined) {
      // Remover todas as tags existentes
      await prisma.taskCustomTag.deleteMany({
        where: { taskId: params.id }
      });

      // Adicionar novas tags
      if (Array.isArray(customTagIds) && customTagIds.length > 0) {
        await prisma.taskCustomTag.createMany({
          data: customTagIds.map((tagId: string) => ({
            taskId: params.id,
            tagId
          }))
        });
      }
    }

    // Buscar a tarefa atualizada com todas as relações
    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
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

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/tasks');

    return NextResponse.json(updatedTask);

  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status, priority, customStatusId, customPriorityId } = await request.json();

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (customStatusId !== undefined) updateData.customStatusId = customStatusId;
    if (customPriorityId !== undefined) updateData.customPriorityId = customPriorityId;

    const task = await prisma.task.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: updateData,
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

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/tasks');

    return NextResponse.json(task);

  } catch (error) {
    console.error('Task status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.task.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      }
    });

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/tasks');

    return NextResponse.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
