

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDownloadUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Gera URL assinada válida por 1 hora
    const url = await getDownloadUrl(key);

    return NextResponse.json({ url }, { status: 200 });

  } catch (error) {
    console.error('Download URL error:', error);
    return NextResponse.json({ 
      error: 'Erro ao gerar URL de download' 
    }, { status: 500 });
  }
}
