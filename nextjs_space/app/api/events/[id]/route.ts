
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        reminders: true,
        customEventType: true
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (event.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(event);

  } catch (error) {
    console.error('Event GET error:', error);
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

    const event = await prisma.event.findUnique({
      where: { id: params.id }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (event.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      type,
      customEventTypeId,
      location, 
      color, 
      allDay,
      reminders 
    } = await request.json();

    // Atualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(type !== undefined && { type }),
        ...(customEventTypeId !== undefined && { customEventTypeId }),
        ...(location !== undefined && { location }),
        ...(color !== undefined && { color }),
        ...(allDay !== undefined && { allDay }),
      },
      include: {
        reminders: true,
        customEventType: true
      }
    });

    // Atualizar lembretes se fornecidos
    if (reminders !== undefined) {
      // Remover lembretes antigos
      await prisma.reminder.deleteMany({
        where: { eventId: params.id }
      });

      // Criar novos lembretes
      if (reminders.length > 0) {
        await prisma.reminder.createMany({
          data: reminders.map((r: any) => ({
            eventId: params.id,
            time: new Date(r.time),
            type: r.type || 'NOTIFICATION'
          }))
        });
      }
    }

    // Buscar evento atualizado com lembretes
    const finalEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        reminders: true,
        customEventType: true
      }
    });

    return NextResponse.json(finalEvent);

  } catch (error) {
    console.error('Event update error:', error);
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

    const event = await prisma.event.findUnique({
      where: { id: params.id }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (event.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Event delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
