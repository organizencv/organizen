import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Listar tarefas do evento (apenas colaboradores)
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

    const eventId = params.id;
    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Verificar se o evento existe e pertence à empresa
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        companyId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

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

    // Buscar tarefas do evento
    const tasks = await prisma.task.findMany({
      where: {
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
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(tasks);

  } catch (error) {
    console.error('Event tasks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Criar tarefa do evento (apenas colaboradores)
export async function POST(
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

    const eventId = params.id;
    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Verificar se o evento existe e pertence à empresa
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        companyId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

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

    const body = await request.json();
    const { title, description, dueDate, priority, status, assignedUserId, memberIds } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validar que o assignedUserId é colaborador do evento
    const targetUserId = assignedUserId || userId;
    const assignedIsCollaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId,
        userId: targetUserId,
      },
    });

    if (!assignedIsCollaborator) {
      return NextResponse.json(
        { error: 'Assigned user must be a collaborator of this event' },
        { status: 400 }
      );
    }

    // Criar tarefa
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        userId: targetUserId,
        companyId,
        eventId, // Vincula à tarefa ao evento
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
      },
    });

    // Adicionar membros se fornecidos
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Validar que todos os membros são colaboradores do evento
      const validMembers = await prisma.eventCollaborator.findMany({
        where: {
          eventId,
          userId: { in: memberIds },
        },
        select: { userId: true },
      });

      const validMemberIds = validMembers.map(m => m.userId);

      if (validMemberIds.length > 0) {
        await prisma.taskMember.createMany({
          data: [
            // Owner
            {
              taskId: task.id,
              userId: targetUserId,
              role: 'OWNER',
            },
            // Members
            ...validMemberIds
              .filter(id => id !== targetUserId)
              .map(memberId => ({
                taskId: task.id,
                userId: memberId,
                role: 'MEMBER',
              })),
          ],
          skipDuplicates: true,
        });
      }
    } else {
      // Adicionar apenas o owner
      await prisma.taskMember.create({
        data: {
          taskId: task.id,
          userId: targetUserId,
          role: 'OWNER',
        },
      });
    }

    // Buscar tarefa completa com membros
    const fullTask = await prisma.task.findUnique({
      where: { id: task.id },
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
      },
    });

    return NextResponse.json(fullTask, { status: 201 });

  } catch (error) {
    console.error('Event task creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
