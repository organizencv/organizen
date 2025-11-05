
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LogoUploader } from '@/components/branding/logo-uploader';
import { BackgroundUploader } from '@/components/branding/background-uploader';
import { ColorPicker } from '@/components/branding/color-picker';
import { BrandingPreview } from '@/components/branding/branding-preview';
import { Textarea } from '@/components/ui/textarea';
import { Save, RotateCcw, Loader2, AlertTriangle, Sparkles, Mail, ArrowRight } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface BrandingConfig {
  id: string;
  logoUrl?: string | null;
  logoSize?: number;
  primaryColor: string;
  secondaryColor?: string | null;
  accentColor?: string | null;
  theme: string;
  loginBackgroundType: string;
  loginBackgroundImage?: string | null;
  loginBackgroundColor?: string | null;
  welcomeMessage?: string | null;
  tagline?: string | null;
  supportLink?: string | null;
  termsLink?: string | null;
  privacyLink?: string | null;
  isActive: boolean;
}

export default function BrandingPage() {
  const { data: session } = useSession() || {};
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar configurações
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/branding');
        if (!response.ok) throw new Error('Erro ao carregar configurações');
        
        const data = await response.json();
        setConfig(data);
        
        // Se tem logoUrl, buscar URL assinada para preview
        if (data.logoUrl) {
          const urlResponse = await fetch(`/api/branding/logo-url?key=${encodeURIComponent(data.logoUrl)}`);
          if (urlResponse.ok) {
            const { url } = await urlResponse.json();
            setLogoPreviewUrl(url);
          }
        }

        // Se tem background image, buscar URL assinada
        if (data.loginBackgroundImage) {
          const bgResponse = await fetch(`/api/branding/background-url?key=${encodeURIComponent(data.loginBackgroundImage)}`);
          if (bgResponse.ok) {
            const { url } = await bgResponse.json();
            setBackgroundPreviewUrl(url);
          }
        }
      } catch (error) {
        console.error('Error loading config:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar configurações de branding.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [toast]);

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      const updated = await response.json();
      setConfig(updated);
      setHasChanges(false);

      toast({
        title: 'Sucesso!',
        description: 'Configurações de branding atualizadas.',
      });

      // Recarregar a página para aplicar mudanças
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao salvar configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja resetar todas as configurações para o padrão?')) {
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch('/api/branding', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao resetar');

      const updated = await response.json();
      setConfig(updated);
      setHasChanges(false);

      toast({
        title: 'Sucesso!',
        description: 'Configurações resetadas para o padrão.',
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error resetting:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao resetar configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const updateConfig = (updates: Partial<BrandingConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...updates } : null));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar configurações de branding.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-3">
          <BackButton fallbackRoute="/settings" variant="ghost" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Branding Corporativo</h1>
        </div>
        <p className="text-muted-foreground">
          Personalize a aparência do OrganiZen com o logotipo e cores da sua empresa
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <div className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Logotipo</CardTitle>
              <CardDescription>
                Faça upload do logotipo da sua empresa (PNG, JPG ou SVG, máx. 2MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LogoUploader
                currentLogo={logoPreviewUrl}
                onUploadComplete={async (logoKey) => {
                  updateConfig({ logoUrl: logoKey });
                  // Buscar URL assinada para preview
                  try {
                    const urlResponse = await fetch(`/api/branding/logo-url?key=${encodeURIComponent(logoKey)}`);
                    if (urlResponse.ok) {
                      const { url } = await urlResponse.json();
                      setLogoPreviewUrl(url);
                    }
                  } catch (error) {
                    console.error('Error fetching logo URL:', error);
                  }
                }}
                onRemove={() => {
                  updateConfig({ logoUrl: null });
                  setLogoPreviewUrl(null);
                }}
              />

              {config.logoUrl && (
                <div className="space-y-2">
                  <Label>Tamanho do Logo (pixels)</Label>
                  <Input
                    type="number"
                    min="50"
                    max="300"
                    value={config.logoSize || 150}
                    onChange={(e) =>
                      updateConfig({ logoSize: parseInt(e.target.value) || 150 })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cores */}
          <Card>
            <CardHeader>
              <CardTitle>Cores Corporativas</CardTitle>
              <CardDescription>
                Defina as cores da identidade visual da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker
                label="Cor Primária"
                value={config.primaryColor}
                onChange={(color) => updateConfig({ primaryColor: color })}
              />

              <ColorPicker
                label="Cor Secundária (opcional)"
                value={config.secondaryColor || '#8B5CF6'}
                onChange={(color) => updateConfig({ secondaryColor: color })}
              />

              <ColorPicker
                label="Cor de Destaque (opcional)"
                value={config.accentColor || '#10B981'}
                onChange={(color) => updateConfig({ accentColor: color })}
              />
            </CardContent>
          </Card>

          {/* Login/Signup Personalizado */}
          <Card>
            <CardHeader>
              <CardTitle>Tela de Login/Signup</CardTitle>
              <CardDescription>
                Personalize a experiência de login da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem de Boas-vindas</Label>
                <Input
                  placeholder="Ex: Bem-vindo ao sistema da sua empresa!"
                  value={config.welcomeMessage || ''}
                  onChange={(e) => updateConfig({ welcomeMessage: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Slogan/Tagline</Label>
                <Input
                  placeholder="Ex: Gestão inteligente para sua empresa"
                  value={config.tagline || ''}
                  onChange={(e) => updateConfig({ tagline: e.target.value })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tipo de Fundo</Label>
                <Select
                  value={config.loginBackgroundType}
                  onValueChange={(value) => {
                    updateConfig({ loginBackgroundType: value });
                    if (value !== 'image') {
                      setBackgroundPreviewUrl(null);
                      updateConfig({ loginBackgroundImage: null });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gradient">Gradiente (padrão)</SelectItem>
                    <SelectItem value="solid">Cor Sólida</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.loginBackgroundType === 'solid' && (
                <ColorPicker
                  label="Cor de Fundo"
                  value={config.loginBackgroundColor || '#F3F4F6'}
                  onChange={(color) => updateConfig({ loginBackgroundColor: color })}
                />
              )}

              {config.loginBackgroundType === 'image' && (
                <BackgroundUploader
                  currentBackground={backgroundPreviewUrl}
                  onUploadComplete={async (bgKey) => {
                    updateConfig({ loginBackgroundImage: bgKey });
                    try {
                      const urlResponse = await fetch(`/api/branding/background-url?key=${encodeURIComponent(bgKey)}`);
                      if (urlResponse.ok) {
                        const { url } = await urlResponse.json();
                        setBackgroundPreviewUrl(url);
                      }
                    } catch (error) {
                      console.error('Error fetching background URL:', error);
                    }
                  }}
                  onRemove={() => {
                    updateConfig({ loginBackgroundImage: null });
                    setBackgroundPreviewUrl(null);
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Links Personalizados */}
          <Card>
            <CardHeader>
              <CardTitle>Links Personalizados</CardTitle>
              <CardDescription>
                Adicione links para suporte, termos e políticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Link de Suporte</Label>
                <Input
                  type="url"
                  placeholder="https://suporte.suaempresa.com"
                  value={config.supportLink || ''}
                  onChange={(e) => updateConfig({ supportLink: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Termos de Uso</Label>
                <Input
                  type="url"
                  placeholder="https://suaempresa.com/termos"
                  value={config.termsLink || ''}
                  onChange={(e) => updateConfig({ termsLink: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Política de Privacidade</Label>
                <Input
                  type="url"
                  placeholder="https://suaempresa.com/privacidade"
                  value={config.privacyLink || ''}
                  onChange={(e) => updateConfig({ privacyLink: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select
                  value={config.theme}
                  onValueChange={(value) => updateConfig({ theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Branding Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Aplicar personalização em toda a plataforma
                  </p>
                </div>
                <Switch
                  checked={config.isActive}
                  onCheckedChange={(checked) => updateConfig({ isActive: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Alterações
                </>
              )}
            </Button>

            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetar
                </>
              )}
            </Button>
          </div>

          {hasChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tem alterações não guardadas. Clique em "Guardar Alterações" para aplicar.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-8 h-fit">
          <BrandingPreview
            logoUrl={logoPreviewUrl}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor || undefined}
            accentColor={config.accentColor || undefined}
          />
        </div>
      </div>
    </div>
  );
}
