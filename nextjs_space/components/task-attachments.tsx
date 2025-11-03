'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Trash2, File, FileImage, FileText, Paperclip, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface TaskAttachmentsProps {
  taskId: string;
  attachments: any[];
  onUpdate: (task: any) => void;
  language: Language;
}

export function TaskAttachments({ taskId, attachments, onUpdate, language }: TaskAttachmentsProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          {getTranslation('attachFileToTask', language)}
        </Button>
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
            <Card key={attachment?.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {attachment?.mimeType?.startsWith('image/') ? (
                      <div className="relative w-16 h-16 rounded overflow-hidden bg-muted">
                        <Image
                          src={`/api/tasks/attachments/download?id=${attachment?.id}`}
                          alt={attachment?.fileName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      getFileIcon(attachment?.mimeType)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{attachment?.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(attachment?.fileSize)}</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(attachment?.id, attachment?.fileName)}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        {getTranslation('download', language)}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(attachment?.id)}
                        className="gap-1 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
