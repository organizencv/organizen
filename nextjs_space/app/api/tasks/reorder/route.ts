
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, companyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const { orderedIds }: { orderedIds: string[] } = await request.json();

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });
    }

    // Update the displayOrder for each task
    // Only allow reordering tasks that belong to the user or if user is admin/manager
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.task.updateMany({
          where: {
            id,
            companyId: user.companyId,
            ...(user.role === 'STAFF' ? { userId: user.id } : {}),
          },
          data: { displayOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar tarefas' },
      { status: 500 }
    );
  }
}
