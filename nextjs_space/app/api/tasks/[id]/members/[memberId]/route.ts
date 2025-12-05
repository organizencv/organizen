
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// DELETE - Remover um membro da tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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

    // Verificar se o membro existe
    const member = await prisma.taskMember.findUnique({
      where: {
        id: params.memberId,
        taskId: params.id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Remover o membro
    await prisma.taskMember.delete({
      where: {
        id: params.memberId,
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing task member:', error);
    return NextResponse.json(
      { error: 'Failed to remove task member' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar o papel de um membro
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    if (!role) {
      return NextResponse.json(
        { error: 'role is required' },
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

    // Verificar se o membro existe
    const member = await prisma.taskMember.findUnique({
      where: {
        id: params.memberId,
        taskId: params.id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Atualizar o papel do membro
    const updatedMember = await prisma.taskMember.update({
      where: {
        id: params.memberId,
      },
      data: {
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

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating task member:', error);
    return NextResponse.json(
      { error: 'Failed to update task member' },
      { status: 500 }
    );
  }
}
