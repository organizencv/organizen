
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { generateUserDigest } from '@/lib/notification-service';



export const dynamic = 'force-dynamic';

// GET /api/settings/notifications/digest - Gerar resumo do usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly'; // daily, weekly, monthly

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Período inválido. Use: daily, weekly, ou monthly' },
        { status: 400 }
      );
    }

    const digest = await generateUserDigest(session.user.id, period as 'daily' | 'weekly' | 'monthly');

    return NextResponse.json({
      period,
      userId: session.user.id,
      digest,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar resumo' },
      { status: 500 }
    );
  }
}
