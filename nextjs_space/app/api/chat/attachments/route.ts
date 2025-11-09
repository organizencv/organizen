
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, getDownloadUrl } from '@/lib/s3';

// Configurações de upload
const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav']
};

const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024,   // 5MB (será comprimido para ~1MB no client)
  video: 50 * 1024 * 1024,  // 50MB
  audio: 10 * 1024 * 1024   // 10MB
};

// Helper para determinar categoria do ficheiro
function getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | null {
  if (ALLOWED_TYPES.images.includes(mimeType)) return 'image';
  if (ALLOWED_TYPES.videos.includes(mimeType)) return 'video';
  if (ALLOWED_TYPES.audio.includes(mimeType)) return 'audio';
  return null;
}

// POST: Upload de anexo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 });
    }

    // Validar tipo de ficheiro
    const category = getFileCategory(file.type);
    if (!category) {
      return NextResponse.json({ 
        error: `Tipo de ficheiro não suportado: ${file.type}. Tipos permitidos: imagens, vídeos (mp4, webm) e áudio (mp3, ogg, wav)` 
      }, { status: 400 });
    }

    // Validar tamanho baseado na categoria
    const maxSize = MAX_FILE_SIZE[category];
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return NextResponse.json({ 
        error: `Ficheiro muito grande (${fileSizeMB}MB). Tamanho máximo para ${category === 'image' ? 'imagens' : category === 'video' ? 'vídeos' : 'áudio'}: ${maxSizeMB}MB` 
      }, { status: 400 });
    }

    // Converter File para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Gerar nome único para o ficheiro
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `chat/${timestamp}-${sanitizedName}`;
    
    // Upload para S3
    console.log('📤 Uploading file to S3:', fileName);
    const cloud_storage_path = await uploadFile(buffer, fileName);
    console.log('✅ File uploaded:', cloud_storage_path);
    
    // Criar registro no banco
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        cloud_storage_path
      }
    });

    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      cloud_storage_path: attachment.cloud_storage_path,
      createdAt: attachment.createdAt
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Erro ao fazer upload do ficheiro',
      details: error.message 
    }, { status: 500 });
  }
}

// GET: Obter URL de download para anexo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');
    
    if (!attachmentId) {
      return NextResponse.json({ error: 'ID do anexo é obrigatório' }, { status: 400 });
    }

    // Buscar anexo
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 });
    }

    // Gerar URL assinada
    const downloadUrl = await getDownloadUrl(attachment.cloud_storage_path);

    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      downloadUrl,
      createdAt: attachment.createdAt
    });

  } catch (error: any) {
    console.error('Download URL error:', error);
    return NextResponse.json({ 
      error: 'Erro ao gerar URL de download',
      details: error.message 
    }, { status: 500 });
  }
}
