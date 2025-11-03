
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
      select: { role: true, companyId: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Sem permissões' }, { status: 403 });
    }

    const { orderedIds }: { orderedIds: string[] } = await request.json();

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });
    }

    // Update the displayOrder for each shift
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.shift.update({
          where: { id, companyId: user.companyId },
          data: { displayOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering shifts:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar turnos' },
      { status: 500 }
    );
  }
}
