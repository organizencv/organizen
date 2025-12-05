
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = "force-dynamic";

export async function GET(
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

    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
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
        subtasks: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        comments: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'desc' }
        },
        checkItems: {
          orderBy: { order: 'asc' }
        },
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

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

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

    // Buscar tarefa atual para verificar mudança de status
    const currentTask = await prisma.task.findUnique({
      where: { id: params.id },
      select: { status: true, startedAt: true, completedAt: true }
    });

    // Preparar dados de atualização
    const updateData: any = {
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'PENDING',
      priority: priority || 'MEDIUM',
      userId: userId || session.user.id,
      customStatusId: customStatusId !== undefined ? customStatusId : undefined,
      customPriorityId: customPriorityId !== undefined ? customPriorityId : undefined,
    };

    // Registar timestamp de início quando muda para IN_PROGRESS
    if (status === 'IN_PROGRESS' && currentTask?.status !== 'IN_PROGRESS' && !currentTask?.startedAt) {
      updateData.startedAt = new Date();
    }

    // Registar timestamp de conclusão quando muda para COMPLETED
    if (status === 'COMPLETED' && currentTask?.status !== 'COMPLETED' && !currentTask?.completedAt) {
      updateData.completedAt = new Date();
    }

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
        comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
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
        comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
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

    // Buscar tarefa atual para verificar timestamps existentes
    const currentTask = await prisma.task.findUnique({
      where: { id: params.id },
      select: { status: true, startedAt: true, completedAt: true }
    });

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      
      // Registar timestamp de início quando muda para IN_PROGRESS (apenas se não existir)
      if (status === 'IN_PROGRESS' && !currentTask?.startedAt) {
        updateData.startedAt = new Date();
      }
      
      // Registar timestamp de conclusão quando muda para COMPLETED (apenas se não existir)
      if (status === 'COMPLETED' && !currentTask?.completedAt) {
        updateData.completedAt = new Date();
        // Se não tiver startedAt, setar também (caso tenha pulado o "Iniciar")
        if (!currentTask?.startedAt) {
          updateData.startedAt = new Date();
        }
      }
    }
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
        comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
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
