
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

    const { title, description, startTime, endTime, userId } = await request.json();

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
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
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/shifts');

    return NextResponse.json(shift);

  } catch (error) {
    console.error('Shift update error:', error);
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

  } catch (error) {
    console.error('Shift deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
