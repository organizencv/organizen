
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/events - Listar eventos da empresa
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.eventType = type;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        collaborators: {
          select: {
            id: true,
            userId: true,
            role: true,
            canManage: true,
          },
        },
        images: {
          select: {
            id: true,
            fileName: true,
            cloud_storage_path: true,
          },
          take: 1, // Apenas primeira imagem para listagem
        },
        _count: {
          select: {
            collaborators: true,
            images: true,
            chatMessages: true,
          },
        },
      },
      orderBy: {
        eventDate: 'desc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Criar novo evento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas ADMIN e MANAGER podem criar eventos
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
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

    // Validações
    if (!name || !eventDate) {
      return NextResponse.json(
        { error: 'Name and event date are required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        eventType: eventType || 'OTHER',
        location,
        eventDate: new Date(eventDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'PLANNING',
        budget: budget ? parseFloat(budget) : null,
        estimatedGuests: estimatedGuests ? parseInt(estimatedGuests) : null,
        notes,
        companyId: session.user.companyId,
        createdBy: session.user.id,
      },
      include: {
        collaborators: true,
        images: true,
        _count: {
          select: {
            collaborators: true,
            images: true,
            chatMessages: true,
          },
        },
      },
    });

    // Adicionar o criador como colaborador com role COORDINATOR
    await prisma.eventCollaborator.create({
      data: {
        eventId: event.id,
        userId: session.user.id,
        role: 'COORDINATOR',
        canManage: true,
        canChat: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
