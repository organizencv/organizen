
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';

import { GetObjectCommand } from '@aws-sdk/client-s3';

import { createS3Client, getBucketConfig } from '@/lib/aws-config';



export const dynamic = 'force-dynamic';

const s3Client = createS3Client();
const { bucketName } = getBucketConfig();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true }
    });

    if (!user?.image) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
    }

    // Buscar imagem do S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: user.image,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
    }

    // Converter stream para buffer
    const chunks: Uint8Array[] = [];
    // @ts-ignore
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Determinar content type
    const contentType = response.ContentType || 'image/jpeg';

    // Retornar imagem diretamente
    // Cache por 1 hora mas permite revalidação
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'ETag': user.image, // Usar o path S3 como ETag
      },
    });
  } catch (error) {
    console.error('Erro ao carregar foto:', error);
    return NextResponse.json({ 
      error: 'Erro ao carregar foto' 
    }, { status: 500 });
  }
}
