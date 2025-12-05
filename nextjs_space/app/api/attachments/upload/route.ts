
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageId = formData.get('messageId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Verificar tamanho (50MB máximo)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Converter para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload para S3
    const cloud_storage_path = await uploadFile(buffer, file.name);

    // Criar registro de anexo (temporário se não houver messageId)
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        cloud_storage_path,
        messageId: messageId || null, // null se for temporário
      }
    });

    return NextResponse.json({
      success: true,
      cloud_storage_path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        cloud_storage_path: attachment.cloud_storage_path
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
