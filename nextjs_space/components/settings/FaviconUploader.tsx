
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface FaviconUploaderProps {
  currentFavicon?: string | null;
  onSuccess?: () => void;
}

export function FaviconUploader({ currentFavicon, onSuccess }: FaviconUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [favicon, setFavicon] = useState(currentFavicon);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 500KB)
    if (file.size > 500 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 500KB");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/settings/company/favicon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }

      const data = await response.json();
      setFavicon(data.url);
      toast.success("Favicon atualizado com sucesso!");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao fazer upload do favicon:", error);
      toast.error(error.message || "Erro ao fazer upload do favicon");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);

    try {
      const response = await fetch("/api/settings/company/favicon", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao remover favicon");
      }

      setFavicon(null);
      toast.success("Favicon removido com sucesso!");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao remover favicon:", error);
      toast.error("Erro ao remover favicon");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Favicon do Site</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Ícone exibido na aba do navegador. Recomendado: SVG, PNG ou ICO (16x16 ou 32x32)
        </p>
      </div>

      {/* Preview */}
      {favicon && (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="relative w-16 h-16 border rounded bg-white flex items-center justify-center">
            {favicon.endsWith('.svg') ? (
              <img src={favicon} alt="Favicon" className="w-8 h-8" />
            ) : (
              <Image
                src={favicon}
                alt="Favicon"
                width={32}
                height={32}
                className="object-contain"
              />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Favicon atual</p>
            <p className="text-xs text-muted-foreground">{favicon}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload */}
      <div>
        <input
          type="file"
          id="favicon-upload"
          accept=".svg,.png,.ico"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("favicon-upload")?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "A enviar..." : favicon ? "Alterar Favicon" : "Enviar Favicon"}
        </Button>
      </div>

      {!favicon && (
        <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
          <ImageIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Sem favicon personalizado</p>
            <p>Está a usar o favicon padrão do OrganiZen.</p>
          </div>
        </div>
      )}
    </div>
  );
}
