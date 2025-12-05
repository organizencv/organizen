
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDownloadUrl } from '@/lib/s3';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
      include: {
        message: true
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão (é remetente ou destinatário)
    const userId = session.user.id;
    if (
      attachment.message &&
      attachment.message.senderId !== userId && 
      attachment.message.receiverId !== userId
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Gerar URL assinada
    const downloadUrl = await getDownloadUrl(attachment.cloud_storage_path);

    return NextResponse.json({
      downloadUrl,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
