
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

/**
 * GET /api/users/approval/count
 * Retorna o número de usuários pendentes de aprovação
 * Apenas para ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas ADMIN pode ver a contagem
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ count: 0 });
    }

    // Contar usuários pendentes da mesma empresa
    const count = await prisma.user.count({
      where: {
        companyId: session.user.companyId,
        approved: false,
      }
    });

    return NextResponse.json({ count });

  } catch (error) {
    console.error('Error counting pending users:', error);
    return NextResponse.json({ count: 0 });
  }
}
