

'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, File, Image as ImageIcon, Video, Music, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ImageLightbox } from './image-lightbox';

interface ChatMessageAttachmentProps {
  attachmentUrl: string;
  attachmentType: string;
  attachmentName: string;
  attachmentSize?: number;
  isOwnMessage: boolean;
}

export function ChatMessageAttachment({ 
  attachmentUrl, 
  attachmentType, 
  attachmentName, 
  attachmentSize,
  isOwnMessage 
}: ChatMessageAttachmentProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Buscar URL assinada quando componente monta
  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        const response = await fetch(`/api/chat/download?key=${encodeURIComponent(attachmentUrl)}`);
        if (response.ok) {
          const data = await response.json();
          setSignedUrl(data.url);
        } else {
          console.error('Failed to fetch signed URL');
        }
      } catch (error) {
        console.error('Error fetching signed URL:', error);
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchSignedUrl();
  }, [attachmentUrl]);

  const handleDownload = async () => {
    if (!signedUrl) return;

    setIsDownloading(true);
    try {
      // Abrir em nova aba para download
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = attachmentName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading state
  if (isLoadingUrl) {
    return (
      <div className="mt-2">
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg border",
          isOwnMessage ? "border-blue-400 bg-blue-500/20" : "border-border bg-muted/50"
        )}>
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!signedUrl) {
    return (
      <div className="mt-2">
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg border",
          "border-red-400 bg-red-500/20"
        )}>
          <File className="h-5 w-5" />
          <p className="text-sm">Erro ao carregar ficheiro</p>
        </div>
      </div>
    );
  }

  // Renderização para imagens
  if (attachmentType === 'image') {
    return (
      <>
        {/* Lightbox Modal */}
        {signedUrl && (
          <ImageLightbox
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            imageUrl={signedUrl}
            imageName={attachmentName}
          />
        )}

        <div className="mt-2 relative group">
          {!imageError ? (
            <div className="relative">
              {/* Imagem clicável para abrir lightbox */}
              <div 
                className="relative rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-95 transition-opacity shadow-md hover:shadow-lg"
                onClick={() => setLightboxOpen(true)}
                title="Clique para visualizar em tamanho completo"
              >
                <div className="relative w-full" style={{ maxWidth: '400px' }}>
                  <Image
                    src={signedUrl}
                    alt={attachmentName}
                    width={400}
                    height={300}
                    className="object-contain w-full h-auto rounded-lg"
                    onError={() => setImageError(true)}
                    unoptimized
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              </div>
              
              {/* Overlay com nome e botão de download */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent",
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}>
                <div className="flex items-center justify-between">
                  <p className="text-white text-xs truncate flex-1 mr-2">{attachmentName}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    disabled={isDownloading}
                    title="Fazer download"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors",
                isOwnMessage ? "border-blue-400 bg-blue-500/20" : "border-border bg-muted/50"
              )}
              onClick={handleDownload}
            >
              <ImageIcon className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachmentName}</p>
                {attachmentSize && (
                  <p className="text-xs opacity-70">{formatFileSize(attachmentSize)}</p>
                )}
              </div>
              <Button size="sm" variant="ghost" disabled={isDownloading}>
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </>
    );
  }

  // Renderização para vídeos
  if (attachmentType === 'video') {
    return (
      <div className="mt-2">
        <div className="rounded-lg overflow-hidden bg-black max-w-sm">
          <video 
            controls 
            className="w-full"
            src={signedUrl}
            preload="metadata"
          >
            Seu navegador não suporta vídeos.
          </video>
          <div className={cn(
            "p-2",
            isOwnMessage ? "bg-blue-500/20" : "bg-muted/50"
          )}>
            <p className="text-xs truncate">{attachmentName}</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderização para áudios
  if (attachmentType === 'audio') {
    return (
      <div className="mt-2">
        <div className={cn(
          "rounded-lg p-3 max-w-sm",
          isOwnMessage ? "bg-blue-500/20" : "bg-muted/50"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Music className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium truncate flex-1">{attachmentName}</p>
          </div>
          <audio 
            controls 
            className="w-full"
            src={signedUrl}
            preload="metadata"
          >
            Seu navegador não suporta áudio.
          </audio>
        </div>
      </div>
    );
  }

  // Renderização para documentos
  return (
    <div className="mt-2">
      <div 
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors max-w-sm",
          isOwnMessage ? "border-blue-400 bg-blue-500/20" : "border-border bg-muted/50"
        )}
        onClick={handleDownload}
      >
        <File className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachmentName}</p>
          {attachmentSize && (
            <p className="text-xs opacity-70">{formatFileSize(attachmentSize)}</p>
          )}
        </div>
        <Button size="sm" variant="ghost" disabled={isDownloading}>
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
