
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds deve ser um array' },
        { status: 400 }
      );
    }

    // Verificar que todas as pastas pertencem ao utilizador
    const folders = await prisma.messageFolder.findMany({
      where: {
        id: { in: orderedIds },
        userId: session.user.id
      }
    });

    if (folders.length !== orderedIds.length) {
      return NextResponse.json(
        { error: 'Algumas pastas não foram encontradas' },
        { status: 404 }
      );
    }

    // Atualizar ordem de cada pasta
    await Promise.all(
      orderedIds.map((folderId, index) =>
        prisma.messageFolder.update({
          where: { id: folderId },
          data: { displayOrder: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao reordenar pastas:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar pastas' },
      { status: 500 }
    );
  }
}
