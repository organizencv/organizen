
'use client';

import React, { useState, useRef } from 'react';
import { Camera, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface ProfilePhotoUploaderProps {
  onPhotoUpdate?: (photoUrl: string | null) => void;
}

export function ProfilePhotoUploader({ onPhotoUpdate }: ProfilePhotoUploaderProps) {
  const { data: session, update } = useSession();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoKey, setPhotoKey] = useState<string | null>(session?.user?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido', {
        description: 'Por favor, use arquivos JPG, PNG ou WebP'
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O tamanho máximo é 5MB'
      });
      return;
    }

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      // Guardar a chave S3
      setPhotoKey(data.photoUrl);

      // Atualizar sessão com a chave S3
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.photoUrl
        }
      });

      onPhotoUpdate?.(data.photoUrl);
      toast.success('Foto de perfil atualizada!');
      
      // Forçar reload da página para atualizar o avatar
      window.location.reload();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!photoKey) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/profile/photo', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao remover foto');
      }

      setPhotoKey(null);

      // Atualizar sessão
      await update({
        ...session,
        user: {
          ...session?.user,
          image: null
        }
      });

      onPhotoUpdate?.(null);
      toast.success('Foto de perfil removida');
      
      // Forçar reload da página para atualizar o avatar
      window.location.reload();
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast.error('Erro ao remover foto');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <UserAvatar 
          user={{
            ...session?.user,
            image: photoKey
          }} 
          size="xl"
          className="ring-4 ring-background"
        />
        
        {/* Overlay com ícone de câmera */}
        <div 
          className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A carregar...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Carregar Foto
            </>
          )}
        </Button>

        {photoKey && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={uploading || deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A remover...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </>
            )}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG ou WebP. Máximo 5MB.
      </p>
    </div>
  );
}
