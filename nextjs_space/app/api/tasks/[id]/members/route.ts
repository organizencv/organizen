
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Listar todos os membros de uma tarefa
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

    // Verificar se a tarefa existe e pertence à empresa do utilizador
    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const members = await prisma.taskMember.findMany({
      where: {
        taskId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching task members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task members' },
      { status: 500 }
    );
  }
}

// POST - Adicionar um novo membro à tarefa
export async function POST(
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

    const { userId, role = 'MEMBER' } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verificar se a tarefa existe e pertence à empresa do utilizador
    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Verificar se o utilizador existe e pertence à mesma empresa
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        companyId: session.user.companyId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verificar se o membro já existe
    const existingMember = await prisma.taskMember.findUnique({
      where: {
        taskId_userId: {
          taskId: params.id,
          userId: userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this task' },
        { status: 400 }
      );
    }

    // Criar o membro
    const member = await prisma.taskMember.create({
      data: {
        taskId: params.id,
        userId: userId,
        role: role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding task member:', error);
    return NextResponse.json(
      { error: 'Failed to add task member' },
      { status: 500 }
    );
  }
}
