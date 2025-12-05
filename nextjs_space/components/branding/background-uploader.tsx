
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackgroundUploaderProps {
  currentBackground?: string | null;
  onUploadComplete: (backgroundKey: string) => void;
  onRemove: () => void;
}

export function BackgroundUploader({
  currentBackground,
  onUploadComplete,
  onRemove,
}: BackgroundUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Use apenas PNG ou JPG.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (5MB para backgrounds)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'background');

      const response = await fetch('/api/branding/background', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no upload');
      }

      const { key } = await response.json();
      onUploadComplete(key);

      toast({
        title: 'Sucesso!',
        description: 'Imagem de fundo carregada.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Imagem de Fundo</Label>

      {currentBackground ? (
        <div className="relative w-full aspect-video rounded-lg border-2 border-dashed border-border overflow-hidden bg-muted group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentBackground}
            alt="Background preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Error loading background image:', currentBackground);
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
              type="button"
            >
              <X className="mr-2 h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/30 transition-colors">
          <div className="flex flex-col items-center justify-center py-8">
            {isUploading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Clique para fazer upload
                  <br />
                  <span className="text-xs">PNG ou JPG (máx. 5MB)</span>
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
