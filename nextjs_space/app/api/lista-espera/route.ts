
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obter utilizadores na lista de espera
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar informações do utilizador
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Apenas ADMIN, MANAGER e SUPERVISOR podem ver a lista de espera
    if (!['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar utilizadores sem equipa (na lista de espera)
    const waitingUsers = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        teamId: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ users: waitingUsers });
  } catch (error) {
    console.error('Erro ao buscar lista de espera:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar utilizador a uma equipa
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userId, teamId } = await request.json();

    if (!userId || !teamId) {
      return NextResponse.json(
        { error: 'userId e teamId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar informações do utilizador logado
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    if (!['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se a equipa existe e pertence à mesma empresa
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        department: {
          companyId: currentUser.companyId
        }
      },
      include: {
        department: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Equipa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o utilizador a ser adicionado existe e está na lista de espera
    const userToAdd = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: currentUser.companyId,
        teamId: null
      }
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado na lista de espera' },
        { status: 404 }
      );
    }

    // Adicionar utilizador à equipa
    await prisma.user.update({
      where: { id: userId },
      data: {
        teamId: teamId,
        departmentId: team.departmentId
      }
    });

    return NextResponse.json({
      message: 'Utilizador adicionado à equipa com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar utilizador à equipa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover utilizador de equipa (volta para lista de espera)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar informações do utilizador logado
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    if (!['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se o utilizador existe e pertence à mesma empresa
    const userToRemove = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: currentUser.companyId
      }
    });

    if (!userToRemove) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado' },
        { status: 404 }
      );
    }

    // Remover utilizador da equipa (volta para lista de espera)
    await prisma.user.update({
      where: { id: userId },
      data: {
        teamId: null,
        departmentId: null
      }
    });

    return NextResponse.json({
      message: 'Utilizador removido da equipa'
    });
  } catch (error) {
    console.error('Erro ao remover utilizador da equipa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
