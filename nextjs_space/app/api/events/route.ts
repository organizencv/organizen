
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    let eventsQuery: any = {
      where: { companyId },
      include: {
        reminders: true,
        customEventType: true
      },
      orderBy: { startTime: 'asc' }
    };

    // Staff pode ver apenas seus próprios eventos
    if (userRole === 'STAFF') {
      eventsQuery.where.userId = userId;
    }

    const events = await prisma.event.findMany(eventsQuery);

    return NextResponse.json(events);

  } catch (error) {
    console.error('Events GET error:', error);
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

    // Validar tempos
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end && !allDay) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }
    
    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        type: type || 'MEETING',
        customEventTypeId: customEventTypeId || null,
        location: location || null,
        color: color || '#3B82F6',
        allDay: allDay || false,
        userId: session.user.id,
        companyId: session.user.companyId,
        reminders: reminders ? {
          create: reminders.map((r: any) => ({
            time: new Date(r.time),
            type: r.type || 'NOTIFICATION'
          }))
        } : undefined
      },
      include: {
        reminders: true,
        customEventType: true
      }
    });

    return NextResponse.json(event);

  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
