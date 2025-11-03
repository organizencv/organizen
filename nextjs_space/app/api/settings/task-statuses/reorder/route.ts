
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/settings/task-statuses/reorder - Reordenar status
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Apenas ADMIN e MANAGER podem reordenar status
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { statusIds } = body; // Array de IDs na nova ordem

    if (!Array.isArray(statusIds)) {
      return NextResponse.json(
        { error: 'statusIds deve ser um array' },
        { status: 400 }
      );
    }

    // Atualizar a ordem de cada status
    await Promise.all(
      statusIds.map((id, index) =>
        prisma.customTaskStatus.updateMany({
          where: {
            id,
            companyId: user.companyId,
          },
          data: { order: index },
        })
      )
    );

    const updatedStatuses = await prisma.customTaskStatus.findMany({
      where: { companyId: user.companyId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(updatedStatuses);
  } catch (error) {
    console.error('Error reordering task statuses:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar status' },
      { status: 500 }
    );
  }
}
