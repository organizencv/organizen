
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/[id]/chat/upload
 * Faz upload de ficheiro para o chat do evento
 * Retorna os dados do attachment para serem usados ao enviar a mensagem
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário é colaborador com permissão de chat
    const collaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId: params.id,
        userId: session.user.id,
        canChat: true,
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: 'You must be a collaborator with chat permission' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Determinar tipo de attachment
    let attachmentType = 'document';
    if (file.type.startsWith('image/')) {
      attachmentType = 'image';
    } else if (file.type.startsWith('video/')) {
      attachmentType = 'video';
    } else if (file.type.startsWith('audio/')) {
      attachmentType = 'audio';
    }

    // Upload para S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `events/${params.id}/chat/${Date.now()}-${file.name}`;
    const cloud_storage_path = await uploadFile(buffer, s3Key);

    // Retornar dados do attachment para serem usados na mensagem
    return NextResponse.json({
      attachmentUrl: cloud_storage_path,
      attachmentType,
      attachmentName: file.name,
      attachmentSize: file.size,
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading chat file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
