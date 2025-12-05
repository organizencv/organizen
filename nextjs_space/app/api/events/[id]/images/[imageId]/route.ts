
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

// DELETE /api/events/[id]/images/[imageId] - Deletar imagem do evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar a imagem
    const image = await prisma.eventImage.findUnique({
      where: {
        id: params.imageId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Verificar se a imagem pertence ao evento
    if (image.eventId !== params.id) {
      return NextResponse.json(
        { error: 'Image does not belong to this event' },
        { status: 400 }
      );
    }

    // Verificar se o usuário é colaborador do evento ou admin
    const isAdmin = ['ADMIN', 'MANAGER'].includes(session.user.role);
    const isCollaborator = await prisma.eventCollaborator.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: session.user.id,
        },
      },
    });

    // Só pode deletar se for admin ou se for quem fez upload
    if (!isAdmin && image.uploadedBy !== session.user.id && !isCollaborator) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this image' },
        { status: 403 }
      );
    }

    // Deletar do S3
    try {
      await deleteFile(image.cloud_storage_path);
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continua mesmo se falhar no S3 para limpar o banco
    }

    // Deletar do banco de dados
    await prisma.eventImage.delete({
      where: {
        id: params.imageId,
      },
    });

    return NextResponse.json(
      { message: 'Image deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
