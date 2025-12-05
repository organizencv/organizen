
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/events/[id] - Obter detalhes do evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        collaborators: {
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
          orderBy: {
            joinedAt: 'asc',
          },
        },
        images: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            collaborators: true,
            images: true,
            chatMessages: true,
            tasks: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id] - Atualizar evento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário tem permissão para editar
    const collaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId: params.id,
        userId: session.user.id,
        canManage: true,
      },
    });

    const isAdmin = ['ADMIN', 'MANAGER'].includes(session.user.role);

    if (!collaborator && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      eventType,
      location,
      eventDate,
      endDate,
      status,
      budget,
      estimatedGuests,
      notes,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (eventType !== undefined) updateData.eventType = eventType;
    if (location !== undefined) updateData.location = location;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = status;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (estimatedGuests !== undefined) updateData.estimatedGuests = estimatedGuests ? parseInt(estimatedGuests) : null;
    if (notes !== undefined) updateData.notes = notes;

    const event = await prisma.event.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: updateData,
      include: {
        collaborators: true,
        images: true,
        _count: {
          select: {
            collaborators: true,
            images: true,
            chatMessages: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Deletar evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas ADMIN e MANAGER podem deletar eventos
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
