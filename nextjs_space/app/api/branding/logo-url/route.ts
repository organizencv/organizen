

import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { getDownloadUrl } from '@/lib/s3';



export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Chave não fornecida' }, { status: 400 });
    }

    // Gerar URL assinada
    const url = await getDownloadUrl(key);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating logo URL:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL do logo' },
      { status: 500 }
    );
  }
}
