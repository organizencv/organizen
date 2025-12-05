
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, getDownloadUrl } from '@/lib/s3';

// GET /api/events/[id]/images - Listar imagens do evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const images = await prisma.eventImage.findMany({
      where: {
        eventId: params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Buscar informações de quem fez upload
    const uploaderIds = images.map(img => img.uploadedBy);
    const uploaders = await prisma.user.findMany({
      where: {
        id: { in: uploaderIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const imagesWithUploaders = images.map(img => {
      const uploader = uploaders.find(u => u.id === img.uploadedBy);
      return {
        ...img,
        uploader,
      };
    });

    return NextResponse.json(imagesWithUploaders);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/images - Upload de imagem
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário é colaborador do evento
    const collaborator = await prisma.eventCollaborator.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: 'You must be a collaborator to upload images' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Upload para S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `events/${params.id}/${Date.now()}-${file.name}`;
    const cloud_storage_path = await uploadFile(buffer, s3Key);

    // Salvar no banco de dados
    const image = await prisma.eventImage.create({
      data: {
        eventId: params.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        cloud_storage_path: cloud_storage_path,
        uploadedBy: session.user.id,
        description,
      },
    });

    // Buscar informações do uploader
    const uploader = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json(
      {
        ...image,
        uploader,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
