
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

    const { tagIds } = await request.json();

    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ error: 'tagIds deve ser um array' }, { status: 400 });
    }

    // Atualizar a ordem de cada tag
    await Promise.all(
      tagIds.map((id, index) =>
        prisma.customTaskTag.update({
          where: { id },
          data: { order: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering tags:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
