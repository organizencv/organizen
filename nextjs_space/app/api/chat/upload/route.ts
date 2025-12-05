

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (padrão)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB para vídeos

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

function getFileType(mimeType: string): string | null {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type;
    }
  }
  return null;
}

function getMaxSize(fileType: string): number {
  return fileType === 'video' ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const fileType = getFileType(file.type);
    if (!fileType) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não suportado. Formatos aceitos: imagens (JPG, PNG, GIF, WEBP), vídeos (MP4, WEBM), áudios (MP3, WAV, OGG) e documentos (PDF, DOC, DOCX)' 
      }, { status: 400 });
    }

    // Validar tamanho (limite maior para vídeos)
    const maxSize = getMaxSize(fileType);
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json({ 
        error: `Arquivo muito grande. Tamanho máximo para ${fileType === 'video' ? 'vídeos' : 'este tipo de arquivo'}: ${maxSizeMB}MB` 
      }, { status: 400 });
    }

    // Converter para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Gerar nome único
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `chat-media/${timestamp}-${sanitizedName}`;
    
    // Upload para S3
    const cloud_storage_path = await uploadFile(buffer, s3Key);

    return NextResponse.json({
      cloud_storage_path,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      mimeType: file.type
    }, { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Erro ao fazer upload do arquivo' 
    }, { status: 500 });
  }
}
