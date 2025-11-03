
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE /api/teams/:id/members/:userId - Remover membro da equipa
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // STAFF não pode remover membros
    if (user.role === 'STAFF') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se o membro a ser removido é o líder da equipa
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      select: { leaderId: true }
    });

    if (team?.leaderId === params.userId) {
      return NextResponse.json({ 
        error: 'Não é possível remover o líder da equipa. Atribua um novo líder primeiro.' 
      }, { status: 400 });
    }

    // Remover membro da equipa (enviar para lista de espera)
    await prisma.user.update({
      where: { id: params.userId },
      data: { 
        teamId: null,
        departmentId: null
      }
    });

    return NextResponse.json({ 
      message: 'Membro removido e enviado para a lista de espera' 
    });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
  }
}
