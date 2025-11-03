
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const teamId = params.id;
    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds deve ser um array' },
        { status: 400 }
      );
    }

    // Verificar que a equipa existe
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Equipa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar que todos os membros pertencem à equipa
    const members = await prisma.user.findMany({
      where: {
        id: { in: orderedIds },
        teamId: teamId
      }
    });

    if (members.length !== orderedIds.length) {
      return NextResponse.json(
        { error: 'Alguns membros não foram encontrados' },
        { status: 404 }
      );
    }

    // Atualizar ordem de cada membro
    await Promise.all(
      orderedIds.map((memberId, index) =>
        prisma.user.update({
          where: { id: memberId },
          data: { teamMemberOrder: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao reordenar membros da equipa:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar membros da equipa' },
      { status: 500 }
    );
  }
}
