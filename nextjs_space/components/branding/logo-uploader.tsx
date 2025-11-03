
'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface LogoUploaderProps {
  currentLogo?: string | null;
  onUploadComplete: (logoUrl: string) => void;
  onRemove: () => void;
}

export function LogoUploader({ currentLogo, onUploadComplete, onRemove }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

    if (!allowedTypes.includes(file.type)) {
      return 'Formato inválido. Use PNG, JPG ou SVG.';
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 2MB.';
    }

    return null;
  };

  const handleUpload = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Erro no upload',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload');
      }

      const data = await response.json();
      onUploadComplete(data.logoUrl);

      toast({
        title: 'Sucesso!',
        description: 'Logo atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload do logo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Logotipo da Empresa</Label>

      {currentLogo ? (
        <div className="relative border-2 border-dashed rounded-lg p-4 bg-accent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 bg-white rounded border">
                <Image
                  src={currentLogo}
                  alt="Logo atual"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm font-medium">Logo atual</p>
                <p className="text-xs text-muted-foreground">Clique em "Remover" para alterar</p>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="logo-upload"
            className="hidden"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleChange}
            disabled={isUploading}
          />
          <label
            htmlFor="logo-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">A fazer upload...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Clique para fazer upload ou arraste aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG ou SVG (máx. 2MB)
                  </p>
                </div>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
