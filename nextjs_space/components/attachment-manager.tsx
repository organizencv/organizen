
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { getTranslation, Language } from '@/lib/i18n';
import { Paperclip, X, FileText, Image as ImageIcon, Download, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import Image from 'next/image';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloud_storage_path?: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  language: Language;
  readonly?: boolean;
  messageId?: string;
}

export function AttachmentManager({
  attachments,
  onAttachmentsChange,
  language,
  readonly = false,
  messageId
}: AttachmentManagerProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Verificar tamanho (50MB máximo)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: getTranslation('fileTooBig', language),
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (messageId) {
        formData.append('messageId', messageId);
      }

      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Usar o ID retornado pela API (obrigatório)
      if (!data.attachment?.id) {
        throw new Error('Attachment ID not returned from API');
      }

      const newAttachment: Attachment = {
        id: data.attachment.id,
        fileName: data.attachment.fileName,
        fileSize: data.attachment.fileSize,
        mimeType: data.attachment.mimeType,
        cloud_storage_path: data.attachment.cloud_storage_path
      };

      onAttachmentsChange([...attachments, newAttachment]);
      
      toast({
        title: getTranslation('fileUploaded', language),
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro ao carregar ficheiro',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      // Se o anexo já está vinculado a uma mensagem, deletar do servidor
      if (messageId) {
        await fetch(`/api/attachments/${attachmentId}`, {
          method: 'DELETE'
        });
      }

      onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
      
      toast({
        title: getTranslation('removeAttachment', language)
      });
    } catch (error) {
      console.error('Remove attachment error:', error);
      toast({
        title: 'Erro ao remover anexo',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}/download`);
      const data = await response.json();

      // Abrir em nova aba para download
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = attachment.fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Erro ao descarregar ficheiro',
        variant: 'destructive'
      });
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    if (!attachment.mimeType.startsWith('image/')) {
      // Se não for imagem, fazer download direto
      handleDownload(attachment);
      return;
    }

    try {
      const response = await fetch(`/api/attachments/${attachment.id}/download`);
      const data = await response.json();
      setPreviewUrl(data.downloadUrl);
      setPreviewFile(attachment);
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: 'Erro ao visualizar ficheiro',
        variant: 'destructive'
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
      {!readonly && (
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={uploading}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('file-upload')?.click();
              }}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {getTranslation('uploadingFile', language)}
                </>
              ) : (
                <>
                  <Paperclip className="mr-2 h-4 w-4" />
                  {getTranslation('attachFile', language)}
                </>
              )}
            </Button>
          </label>
        </div>
      )}

      {attachments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {getTranslation('attachedFiles', language)} ({attachments.length})
          </p>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-accent rounded-lg border"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(attachment.mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {readonly && (
                  <>
                    {attachment.mimeType.startsWith('image/') && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(attachment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {!readonly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        readonly && (
          <p className="text-sm text-muted-foreground">
            {getTranslation('noAttachments', language)}
          </p>
        )
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.fileName}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="relative w-full h-[600px] bg-muted">
              <Image
                src={previewUrl}
                alt={previewFile?.fileName || 'Preview'}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
