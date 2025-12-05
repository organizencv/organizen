import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = "force-dynamic";

// GET - Detalhes da tarefa (apenas colaboradores do evento)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;
    const taskId = params.taskId;
    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Verificar se o usuário é colaborador do evento
    const isCollaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!isCollaborator) {
      return NextResponse.json(
        { error: 'You are not a collaborator of this event' },
        { status: 403 }
      );
    }

    // Buscar tarefa
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        eventId,
        companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        subtasks: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tags: true,
        attachments: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        checkItems: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);

  } catch (error) {
    console.error('Event task fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT/PATCH - Atualizar tarefa (apenas colaboradores do evento)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;
    const taskId = params.taskId;
    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Verificar se o usuário é colaborador do evento
    const isCollaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!isCollaborator) {
      return NextResponse.json(
        { error: 'You are not a collaborator of this event' },
        { status: 403 }
      );
    }

    // Buscar tarefa atual
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        eventId,
        companyId,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, dueDate, priority, status, userId: newUserId } = body;

    // Preparar dados de atualização
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (newUserId !== undefined) {
      // Validar que o novo usuário é colaborador do evento
      const newUserIsCollaborator = await prisma.eventCollaborator.findFirst({
        where: {
          eventId,
          userId: newUserId,
        },
      });

      if (!newUserIsCollaborator) {
        return NextResponse.json(
          { error: 'Assigned user must be a collaborator of this event' },
          { status: 400 }
        );
      }

      updateData.userId = newUserId;
    }

    // Timestamps automáticos
    if (status !== undefined) {
      updateData.status = status;

      if (status === 'IN_PROGRESS' && !existingTask.startedAt) {
        updateData.startedAt = new Date();
      }

      if (status === 'COMPLETED') {
        if (!existingTask.completedAt) {
          updateData.completedAt = new Date();
        }
        if (!existingTask.startedAt) {
          updateData.startedAt = new Date();
        }
      }
    }

    // Atualizar tarefa
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        subtasks: true,
        tags: true,
        attachments: true,
        comments: true,
        checkItems: true,
      },
    });

    // Revalidar página do evento
    revalidatePath(`/events/${eventId}`);

    return NextResponse.json(task);

  } catch (error) {
    console.error('Event task update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

// DELETE - Excluir tarefa (apenas colaboradores do evento)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;
    const taskId = params.taskId;
    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Verificar se o usuário é colaborador do evento
    const isCollaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!isCollaborator) {
      return NextResponse.json(
        { error: 'You are not a collaborator of this event' },
        { status: 403 }
      );
    }

    // Verificar se a tarefa existe e pertence ao evento
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        eventId,
        companyId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Excluir tarefa (cascade vai excluir subtarefas, comments, etc.)
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Revalidar página do evento
    revalidatePath(`/events/${eventId}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Event task deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
