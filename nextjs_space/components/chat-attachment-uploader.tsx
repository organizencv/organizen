
'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Paperclip, X, Image, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloud_storage_path: string;
}

interface ChatAttachmentUploaderProps {
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // em bytes
}

export function ChatAttachmentUploader({ 
  onAttachmentsChange, 
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024 // 5MB default
}: ChatAttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
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

    // Validar cada ficheiro
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast({
          title: 'Ficheiro muito grande',
          description: `${file.name} excede o tamanho máximo de ${formatFileSize(maxFileSize)}`,
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
      const formData = new FormData();
      formData.append('file', file);

      // Simular progresso (em produção, usar XMLHttpRequest para progresso real)
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
      
      const newAttachments = [...attachments, attachment];
      setAttachments(newAttachments);
      onAttachmentsChange(newAttachments);

      toast({
        title: 'Ficheiro carregado',
        description: `${file.name} foi carregado com sucesso`
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
    setAttachments(newAttachments);
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
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
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
