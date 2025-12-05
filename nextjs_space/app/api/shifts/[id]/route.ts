
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

    const shift = await prisma.shift.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            image: true
          }
        },
        assignments: {
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      );
    }

    // Serialize dates and enums
    const serialized = {
      ...shift,
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime.toISOString(),
      user: {
        ...shift.user,
        role: shift.user.role as string
      },
      assignments: shift.assignments.map(assignment => ({
        ...assignment,
        user: {
          ...assignment.user,
          role: assignment.user.role as string
        }
      }))
    };

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error('Shift fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

    const body = await request.json();
    const { title, description, startTime, endTime, userId, capacity } = body;

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Validar capacidade se foi alterada
    const shiftCapacity = capacity && capacity > 0 ? capacity : 1;
    
    const currentAssignments = await prisma.shiftAssignment.count({
      where: { shiftId: params.id }
    });

    if (shiftCapacity < currentAssignments) {
      return NextResponse.json(
        { error: `Cannot reduce capacity to ${shiftCapacity}. Current assignments: ${currentAssignments}` },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        userId: userId || session.user.id,
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

    console.log('✅ Shift updated successfully:', { shiftId: shift.id });

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/shifts');

    return NextResponse.json(shift);

  } catch (error: any) {
    console.error('Shift update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

    await prisma.shift.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      }
    });

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/shifts');

    return NextResponse.json({ message: 'Shift deleted successfully' });

  } catch (error: any) {
    console.error('Shift deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
