
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/shifts/[id]/assignments - Listar colaboradores atribuídos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        shiftId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching shift assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST /api/shifts/[id]/assignments - Adicionar colaboradores ao turno
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar permissão (apenas ADMIN, MANAGER, SUPERVISOR)
    if (!['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, notes } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    // Buscar o turno para validar capacidade
    const shift = await prisma.shift.findUnique({
      where: { id: params.id },
      include: {
        assignments: true,
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      );
    }

    // Verificar capacidade disponível
    const currentAssignments = shift.assignments.length;
    const availableCapacity = shift.capacity - currentAssignments;

    if (userIds.length > availableCapacity) {
      return NextResponse.json(
        { 
          error: `Capacity exceeded. Available: ${availableCapacity}, Requested: ${userIds.length}`,
          available: availableCapacity,
          requested: userIds.length,
        },
        { status: 400 }
      );
    }

    // Validar conflitos de horário para cada usuário
    const conflicts = [];
    for (const userId of userIds) {
      const conflictingAssignments = await prisma.shiftAssignment.findMany({
        where: {
          userId,
          shift: {
            startTime: {
              lt: shift.endTime,
            },
            endTime: {
              gt: shift.startTime,
            },
          },
        },
        include: {
          shift: true,
        },
      });

      if (conflictingAssignments.length > 0) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        conflicts.push({
          userId,
          userName: user?.name || user?.email,
          conflicts: conflictingAssignments.map(a => ({
            title: a.shift.title,
            startTime: a.shift.startTime,
            endTime: a.shift.endTime,
          })),
        });
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Scheduling conflicts detected',
          conflicts,
        },
        { status: 409 }
      );
    }

    // Criar atribuições em lote
    const assignmentsData = userIds.map((userId: string) => ({
      shiftId: params.id,
      userId,
      notes: notes || undefined,
      status: 'CONFIRMED' as const,
    }));

    const created = await prisma.shiftAssignment.createMany({
      data: assignmentsData,
      skipDuplicates: true, // Evita duplicatas
    });

    // Buscar atribuições criadas para retornar
    const newAssignments = await prisma.shiftAssignment.findMany({
      where: {
        shiftId: params.id,
        userId: {
          in: userIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: `${created.count} assignment(s) created successfully`,
      assignments: newAssignments,
    });
  } catch (error) {
    console.error('Error creating shift assignments:', error);
    return NextResponse.json(
      { error: 'Failed to create assignments' },
      { status: 500 }
    );
  }
}

// DELETE /api/shifts/[id]/assignments - Remover colaboradores do turno
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar permissão
    if (!['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.shiftAssignment.deleteMany({
      where: {
        shiftId: params.id,
        userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Assignment removed successfully',
    });
  } catch (error) {
    console.error('Error deleting shift assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
