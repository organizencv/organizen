
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';

import { getDownloadUrl } from '@/lib/s3';



export const dynamic = 'force-dynamic';

// GET - Obter URL assinada do ícone PWA
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user || !user.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    if (!user.company.pwaIcon) {
      return NextResponse.json({ error: 'Ícone PWA não configurado' }, { status: 404 });
    }

    // Gerar URL assinada
    const signedUrl = await getDownloadUrl(user.company.pwaIcon);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Erro ao obter URL do ícone PWA:', error);
    return NextResponse.json(
      { error: 'Erro ao obter URL do ícone PWA' },
      { status: 500 }
    );
  }
}
