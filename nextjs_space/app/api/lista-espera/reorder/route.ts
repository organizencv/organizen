
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds deve ser um array' },
        { status: 400 }
      );
    }

    // Atualizar ordem de cada utilizador na lista de espera
    await Promise.all(
      orderedIds.map((userId, index) =>
        prisma.user.update({
          where: { id: userId },
          data: { waitingListOrder: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao reordenar lista de espera:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar lista de espera' },
      { status: 500 }
    );
  }
}
