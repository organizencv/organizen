
import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key não fornecida' }, { status: 400 });
    }

    // Gerar URL assinada válida por 1 hora
    const url = await getDownloadUrl(key);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Background URL error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL da imagem de fundo' },
      { status: 500 }
    );
  }
}
