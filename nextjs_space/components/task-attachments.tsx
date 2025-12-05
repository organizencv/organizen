'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Trash2, File, FileImage, FileText, Paperclip, Loader2, Music, Video as VideoIcon, Eye } from 'lucide-react';
import Image from 'next/image';
import { ImageLightbox } from './image-lightbox';
import { cn } from '@/lib/utils';

interface TaskAttachmentsProps {
  taskId: string;
  task?: any;
  attachments: any[];
  onUpdate: (task: any) => void;
  language: Language;
}

interface SignedUrls {
  [key: string]: string;
}

export function TaskAttachments({ taskId, task, attachments, onUpdate, language }: TaskAttachmentsProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [signedUrls, setSignedUrls] = useState<SignedUrls>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [lightboxImage, setLightboxImage] = useState<{url: string, name: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isTaskCompleted = task?.status === 'COMPLETED';

  // Buscar signed URLs para todos os anexos
  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (!attachments || attachments.length === 0) return;

      for (const attachment of attachments) {
        if (!attachment?.id || signedUrls[attachment.id] || loadingUrls.has(attachment.id)) continue;

        setLoadingUrls(prev => new Set(prev).add(attachment.id));

        try {
          const response = await fetch(`/api/tasks/attachments/download?id=${attachment.id}`);
          if (response.ok) {
            const data = await response.json();
            setSignedUrls(prev => ({ ...prev, [attachment.id]: data.url }));
          }
        } catch (error) {
          console.error('Error fetching signed URL:', error);
        } finally {
          setLoadingUrls(prev => {
            const newSet = new Set(prev);
            newSet.delete(attachment.id);
            return newSet;
          });
        }
      }
    };

    fetchSignedUrls();
  }, [attachments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 50 * 1024 * 1024; // 50MB

    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: language === 'pt' ? 'Ficheiro demasiado grande' : 'File too large',
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
          variant: 'destructive',
        });
        continue;
      }

      setUploadingFiles(prev => [...prev, file.name]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId);

        const response = await fetch('/api/tasks/attachments', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          toast({
            title: language === 'pt' ? 'Ficheiro carregado' : 'File uploaded',
            description: file.name,
          });

          const taskResponse = await fetch(`/api/tasks?id=${taskId}`);
          const tasks = await taskResponse.json();
          const updatedTask = tasks.find((t: any) => t.id === taskId);
          if (updatedTask) onUpdate(updatedTask);
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        toast({
          title: language === 'pt' ? 'Erro ao carregar' : 'Upload error',
          description: file.name,
          variant: 'destructive',
        });
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/tasks/attachments/download?id=${attachmentId}`);
      const data = await response.json();

      if (response.ok && data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_blank';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro ao descarregar' : 'Download error',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm(language === 'pt' ? 'Eliminar anexo?' : 'Delete attachment?')) return;

    try {
      const response = await fetch(`/api/tasks/attachments?id=${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Anexo eliminado' : 'Attachment deleted',
        });

        const taskResponse = await fetch(`/api/tasks?id=${taskId}`);
        const tasks = await taskResponse.json();
        const updatedTask = tasks.find((t: any) => t.id === taskId);
        if (updatedTask) onUpdate(updatedTask);
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    } else if (mimeType?.startsWith('video/')) {
      return <VideoIcon className="h-8 w-8 text-purple-500" />;
    } else if (mimeType?.startsWith('audio/')) {
      return <Music className="h-8 w-8 text-green-500" />;
    } else if (mimeType?.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getAttachmentType = (mimeType: string): 'image' | 'video' | 'audio' | 'document' => {
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.startsWith('video/')) return 'video';
    if (mimeType?.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const renderAttachmentPreview = (attachment: any) => {
    const signedUrl = signedUrls[attachment.id];
    const isLoading = loadingUrls.has(attachment.id);
    const type = getAttachmentType(attachment.mimeType);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!signedUrl) {
      return (
        <div className="flex items-center gap-3 p-4">
          {getFileIcon(attachment.mimeType)}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{attachment.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
          </div>
        </div>
      );
    }

    // Renderização para imagens
    if (type === 'image') {
      return (
        <div className="space-y-2">
          <div
            className="relative rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-95 transition-opacity group"
            onClick={() => setLightboxImage({ url: signedUrl, name: attachment.fileName })}
          >
            <div className="relative w-full aspect-video">
              <Image
                src={signedUrl}
                alt={attachment.fileName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            {/* Overlay com ícone de visualização */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Eye className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex items-center justify-between px-2">
            <p className="text-sm truncate flex-1 mr-2">{attachment.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
          </div>
        </div>
      );
    }

    // Renderização para vídeos
    if (type === 'video') {
      return (
        <div className="space-y-2">
          <div className="rounded-lg overflow-hidden bg-black">
            <video
              controls
              className="w-full"
              src={signedUrl}
              preload="metadata"
            >
              Seu navegador não suporta vídeos.
            </video>
          </div>
          <div className="flex items-center justify-between px-2">
            <p className="text-sm truncate flex-1 mr-2">{attachment.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
          </div>
        </div>
      );
    }

    // Renderização para áudios
    if (type === 'audio') {
      return (
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Music className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm font-medium truncate flex-1">{attachment.fileName}</p>
          </div>
          <audio
            controls
            className="w-full"
            src={signedUrl}
            preload="metadata"
          >
            Seu navegador não suporta áudio.
          </audio>
          <p className="text-xs text-muted-foreground text-center">{formatFileSize(attachment.fileSize)}</p>
        </div>
      );
    }

    // Renderização para documentos
    return (
      <div className="flex items-center gap-3 p-4">
        {getFileIcon(attachment.mimeType)}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{attachment.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Lightbox para imagens */}
      {lightboxImage && (
        <ImageLightbox
          isOpen={true}
          onClose={() => setLightboxImage(null)}
          imageUrl={lightboxImage.url}
          imageName={lightboxImage.name}
        />
      )}

      <div className="space-y-2">
        <div className="flex justify-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            size="sm" 
            className="gap-2"
            disabled={isTaskCompleted}
          >
            <Upload className="h-4 w-4" />
            {getTranslation('attachFileToTask', language)}
          </Button>
        </div>
        {isTaskCompleted && (
          <p className="text-xs text-muted-foreground text-right">
            {language === 'pt' 
              ? 'Não é possível adicionar anexos a uma tarefa concluída' 
              : 'Cannot add attachments to a completed task'}
          </p>
        )}
      </div>

      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {uploadingFiles.map((fileName) => (
                <div key={fileName} className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{fileName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Paperclip className="h-8 w-8 text-muted-foreground" />
              {getTranslation('noAttachments', language)}
            </CardContent>
          </Card>
        ) : (
          attachments?.map((attachment: any) => (
            <Card key={attachment?.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Preview do anexo */}
                {renderAttachmentPreview(attachment)}
                
                {/* Botões de ação */}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(attachment?.id, attachment?.fileName)}
                    className="gap-1 flex-1"
                  >
                    <Download className="h-3 w-3" />
                    {getTranslation('download', language)}
                  </Button>
                  {!isTaskCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(attachment?.id)}
                      className="gap-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
