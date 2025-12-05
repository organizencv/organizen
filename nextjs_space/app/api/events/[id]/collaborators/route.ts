
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/events/[id]/collaborators - Listar colaboradores do evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collaborators = await prisma.eventCollaborator.findMany({
      where: {
        eventId: params.id,
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    // Buscar informações dos usuários
    const userIds = collaborators.map(c => c.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Combinar dados
    const collaboratorsWithUsers = collaborators.map(collab => {
      const user = users.find(u => u.id === collab.userId);
      return {
        ...collab,
        user,
      };
    });

    return NextResponse.json(collaboratorsWithUsers);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/collaborators - Adicionar colaborador ao evento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário tem permissão para adicionar colaboradores
    const existingCollaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId: params.id,
        userId: session.user.id,
        canManage: true,
      },
    });

    const isAdmin = ['ADMIN', 'MANAGER'].includes(session.user.role);

    if (!existingCollaborator && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role, canManage, canChat, departmentId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já é colaborador
    const existing = await prisma.eventCollaborator.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a collaborator' },
        { status: 400 }
      );
    }

    const collaborator = await prisma.eventCollaborator.create({
      data: {
        eventId: params.id,
        userId,
        role: role || 'MEMBER',
        canManage: canManage || false,
        canChat: canChat !== false, // Default true
        departmentId,
      },
    });

    // Buscar informações do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...collaborator,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    );
  }
}
