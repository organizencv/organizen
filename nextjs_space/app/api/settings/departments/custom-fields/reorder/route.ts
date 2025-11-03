
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

    const { fieldIds } = await request.json();

    if (!Array.isArray(fieldIds)) {
      return NextResponse.json({ error: 'fieldIds deve ser um array' }, { status: 400 });
    }

    // Atualizar a ordem de cada campo
    await Promise.all(
      fieldIds.map((id, index) =>
        prisma.departmentCustomField.updateMany({
          where: { id, companyId: user.companyId },
          data: { order: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering custom fields:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
