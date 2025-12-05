
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE /api/events/[id]/collaborators/[userId] - Remover colaborador
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário tem permissão
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

    // Não permitir remover o último coordenador
    const coordinators = await prisma.eventCollaborator.count({
      where: {
        eventId: params.id,
        role: 'COORDINATOR',
      },
    });

    const targetCollaborator = await prisma.eventCollaborator.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: params.userId,
        },
      },
    });

    if (coordinators === 1 && targetCollaborator?.role === 'COORDINATOR') {
      return NextResponse.json(
        { error: 'Cannot remove the last coordinator' },
        { status: 400 }
      );
    }

    await prisma.eventCollaborator.delete({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: params.userId,
        },
      },
    });

    return NextResponse.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}
