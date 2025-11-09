
'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Paperclip, X, Image, FileText, Loader2, Video, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloud_storage_path: string;
}

interface ChatAttachmentUploaderProps {
  attachments: Attachment[]; // CONTROLLED: recebe do pai
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
}

// Limites por tipo de ficheiro (alinhados com o backend)
const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024,   // 5MB
  video: 50 * 1024 * 1024,  // 50MB
  audio: 10 * 1024 * 1024   // 10MB
};

export function ChatAttachmentUploader({ 
  attachments, // CONTROLLED: recebe do pai
  onAttachmentsChange, 
  maxFiles = 5
}: ChatAttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Helper para determinar categoria e limite do ficheiro
  const getFileCategory = (mimeType: string): { category: 'image' | 'video' | 'audio' | null, maxSize: number } => {
    if (mimeType.startsWith('image/')) {
      return { category: 'image', maxSize: MAX_FILE_SIZE.image };
    }
    if (mimeType.startsWith('video/')) {
      return { category: 'video', maxSize: MAX_FILE_SIZE.video };
    }
    if (mimeType.startsWith('audio/')) {
      return { category: 'audio', maxSize: MAX_FILE_SIZE.audio };
    }
    return { category: null, maxSize: 0 };
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    if (mimeType.startsWith('video/')) {
      return <Video className="h-4 w-4 text-purple-500" />;
    }
    if (mimeType.startsWith('audio/')) {
      return <Music className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validar número de ficheiros
    if (attachments.length + files.length > maxFiles) {
      toast({
        title: 'Erro',
        description: `Máximo de ${maxFiles} ficheiros permitidos`,
        variant: 'destructive'
      });
      return;
    }

    // Validar e fazer upload de cada ficheiro
    for (const file of files) {
      const { category, maxSize } = getFileCategory(file.type);

      // Validar tipo de ficheiro
      if (!category) {
        toast({
          title: 'Tipo não suportado',
          description: `${file.name}: tipo de ficheiro não suportado`,
          variant: 'destructive'
        });
        continue;
      }

      // Validar tamanho baseado na categoria
      if (file.size > maxSize) {
        const categoryName = category === 'image' ? 'imagens' : category === 'video' ? 'vídeos' : 'áudio';
        toast({
          title: 'Ficheiro muito grande',
          description: `${file.name} (${formatFileSize(file.size)}) excede o limite de ${formatFileSize(maxSize)} para ${categoryName}`,
          variant: 'destructive'
        });
        continue;
      }

      // Upload individual
      await uploadFile(file);
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload = file;

      // 🔥 COMPRESSÃO AUTOMÁTICA DE IMAGENS
      if (file.type.startsWith('image/')) {
        try {
          setUploadProgress(10);
          
          const options = {
            maxSizeMB: 1,              // Comprimir para ~1MB
            maxWidthOrHeight: 1920,    // Máximo 1920px
            useWebWorker: true,
            fileType: file.type,
            initialQuality: 0.85       // 85% de qualidade
          };

          console.log('🖼️ Comprimindo imagem:', file.name, `(${formatFileSize(file.size)})`);
          
          const compressedFile = await imageCompression(file, options);
          
          console.log('✅ Imagem comprimida:', 
            `${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`,
            `(${((1 - compressedFile.size / file.size) * 100).toFixed(0)}% redução)`
          );

          fileToUpload = new File([compressedFile], file.name, {
            type: file.type,
            lastModified: Date.now()
          });

          setUploadProgress(30);

        } catch (compressionError) {
          console.warn('⚠️ Erro ao comprimir, usando ficheiro original:', compressionError);
          // Continuar com ficheiro original se compressão falhar
        }
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/chat/attachments', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      const attachment: Attachment = await response.json();
      
      // Atualizar anexos no pai
      const newAttachments = [...attachments, attachment];
      onAttachmentsChange(newAttachments);

      // Mensagem de sucesso baseada no tipo
      const { category } = getFileCategory(file.type);
      const successMessage = 
        category === 'image' && fileToUpload.size < file.size
          ? `${file.name} foi comprimido e carregado (${formatFileSize(fileToUpload.size)})`
          : category === 'video'
          ? `Vídeo ${file.name} carregado com sucesso (${formatFileSize(file.size)})`
          : category === 'audio'
          ? `Áudio ${file.name} carregado com sucesso (${formatFileSize(file.size)})`
          : `${file.name} foi carregado com sucesso`;

      toast({
        title: 'Ficheiro carregado',
        description: successMessage
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer upload do ficheiro',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    const newAttachments = attachments.filter(a => a.id !== attachmentId);
    onAttachmentsChange(newAttachments);
  };

  return (
    <div className="space-y-2">
      {/* Botão de upload */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime,audio/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || attachments.length >= maxFiles}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || attachments.length >= maxFiles}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar...
            </>
          ) : (
            <>
              <Paperclip className="h-4 w-4" />
              Anexar ficheiro
            </>
          )}
        </Button>
        {attachments.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {attachments.length}/{maxFiles} ficheiros
          </span>
        )}
      </div>

      {/* Progress bar */}
      {uploading && uploadProgress > 0 && (
        <Progress value={uploadProgress} className="h-1" />
      )}

      {/* Lista de anexos */}
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md",
                "bg-muted/50 border border-border",
                "group hover:bg-muted transition-colors"
              )}
            >
              {getFileIcon(attachment.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(attachment.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
