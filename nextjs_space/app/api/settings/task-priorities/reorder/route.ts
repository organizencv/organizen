
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o utilizador é admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { priorityIds } = await request.json();

    if (!Array.isArray(priorityIds)) {
      return NextResponse.json({ error: 'priorityIds deve ser um array' }, { status: 400 });
    }

    // Atualizar a ordem de cada prioridade
    await Promise.all(
      priorityIds.map((id, index) =>
        prisma.customTaskPriority.update({
          where: { id },
          data: { level: index + 1 }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering priorities:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
