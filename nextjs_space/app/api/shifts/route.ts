
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

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

    let shiftsQuery: any = {
      where: { companyId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    };

    // Staff can only see their own shifts
    if (userRole === 'STAFF') {
      shiftsQuery.where.userId = userId;
    }

    const shifts = await prisma.shift.findMany(shiftsQuery);

    return NextResponse.json(shifts);

  } catch (error) {
    console.error('Shifts GET error:', error);
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

    const userRole = session.user.role;
    
    // Check if user can create shifts
    if (userRole === 'STAFF') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { title, description, startTime, endTime, userId, capacity, assignedUserIds } = await request.json();

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Validar capacidade
    const shiftCapacity = capacity && capacity > 0 ? capacity : 1;
    
    // Se tem colaboradores atribuídos, validar que não excede a capacidade
    if (assignedUserIds && assignedUserIds.length > shiftCapacity) {
      return NextResponse.json(
        { error: `Cannot assign ${assignedUserIds.length} users to a shift with capacity ${shiftCapacity}` },
        { status: 400 }
      );
    }

    const assignedUserId = userId || session.user.id;
    
    const shift = await prisma.shift.create({
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        userId: assignedUserId,
        companyId: session.user.companyId,
        capacity: shiftCapacity,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      }
    });

    // Criar notificação se o turno foi atribuído a outro usuário
    if (assignedUserId !== session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            title: 'Novo turno atribuído',
            message: `${session.user.name} atribuiu o turno: ${title}`,
            type: 'SHIFT',
            userId: assignedUserId,
            relatedId: shift.id
          }
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    // Criar atribuições se assignedUserIds foi fornecido
    if (assignedUserIds && Array.isArray(assignedUserIds) && assignedUserIds.length > 0) {
      const assignmentsData = assignedUserIds.map((uid: string) => ({
        shiftId: shift.id,
        userId: uid,
        status: 'CONFIRMED' as const,
      }));

      await prisma.shiftAssignment.createMany({
        data: assignmentsData,
        skipDuplicates: true,
      });

      // Buscar shift com assignments para retornar
      const shiftWithAssignments = await prisma.shift.findUnique({
        where: { id: shift.id },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true }
              }
            }
          }
        }
      });

      // Revalidate relevant pages
      revalidatePath('/dashboard');
      revalidatePath('/shifts');

      return NextResponse.json(shiftWithAssignments);
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/shifts');

    return NextResponse.json(shift);

  } catch (error) {
    console.error('Shift creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
