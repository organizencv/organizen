
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Smartphone } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface PwaIconUploaderProps {
  currentIcon?: string | null;
  onSuccess?: () => void;
}

export function PwaIconUploader({ currentIcon, onSuccess }: PwaIconUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [icon, setIcon] = useState(currentIcon);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 2MB");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/settings/company/pwa-icon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }

      const data = await response.json();
      setIcon(data.url);
      toast.success("Ícone PWA atualizado com sucesso!");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao fazer upload do ícone PWA:", error);
      toast.error(error.message || "Erro ao fazer upload do ícone PWA");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);

    try {
      const response = await fetch("/api/settings/company/pwa-icon", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao remover ícone PWA");
      }

      setIcon(null);
      toast.success("Ícone PWA removido com sucesso!");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao remover ícone PWA:", error);
      toast.error("Erro ao remover ícone PWA");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Ícone PWA (Progressive Web App)</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Ícone exibido quando a app é instalada no dispositivo móvel. Recomendado: PNG ou SVG (512x512)
        </p>
      </div>

      {/* Preview */}
      {icon && (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="relative w-20 h-20 border rounded-lg bg-white flex items-center justify-center">
            {icon.endsWith('.svg') ? (
              <img src={icon} alt="PWA Icon" className="w-16 h-16" />
            ) : (
              <Image
                src={icon}
                alt="PWA Icon"
                width={64}
                height={64}
                className="object-contain"
              />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Ícone PWA atual</p>
            <p className="text-xs text-muted-foreground">{icon}</p>
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
          id="pwa-icon-upload"
          accept=".svg,.png,.jpg,.jpeg"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("pwa-icon-upload")?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "A enviar..." : icon ? "Alterar Ícone PWA" : "Enviar Ícone PWA"}
        </Button>
      </div>

      {!icon && (
        <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
          <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Sem ícone PWA personalizado</p>
            <p>Está a usar o ícone padrão do OrganiZen quando a app é instalada.</p>
          </div>
        </div>
      )}

      <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Dica:</strong> O ícone PWA será redimensionado automaticamente para os tamanhos necessários (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512).
        </p>
      </div>
    </div>
  );
}
