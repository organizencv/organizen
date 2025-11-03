
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, AlertTriangle, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import EmailTemplateEditor from '@/components/branding/EmailTemplateEditor';

export default function EmailTemplatesPage() {
  const { data: session } = useSession() || {};
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);

  // Carregar templates e branding
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar templates de email
        const templatesResponse = await fetch('/api/branding/email-templates');
        if (!templatesResponse.ok) throw new Error('Erro ao carregar templates');
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);

        // Carregar configurações de branding (para logo e cores)
        const brandingResponse = await fetch('/api/branding');
        if (brandingResponse.ok) {
          const brandingData = await brandingResponse.json();
          setBranding(brandingData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar templates de email.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Buscar URL assinada do logo se existir
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  useEffect(() => {
    const fetchLogoUrl = async () => {
      if (branding?.logoUrl) {
        try {
          const response = await fetch(`/api/branding/logo-url?key=${encodeURIComponent(branding.logoUrl)}`);
          if (response.ok) {
            const { url } = await response.json();
            setLogoUrl(url);
          }
        } catch (error) {
          console.error('Error fetching logo URL:', error);
        }
      }
    };

    fetchLogoUrl();
  }, [branding]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!templates) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar templates de email.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Templates de Email</h1>
        </div>
        <p className="text-muted-foreground">
          Personalize os emails enviados pelo sistema com o branding da sua empresa
        </p>
      </div>

      {/* Editor de Templates */}
      <EmailTemplateEditor
        companyId={session?.user?.companyId || ''}
        initialTemplates={templates}
        primaryColor={branding?.primaryColor}
        logoUrl={logoUrl || undefined}
      />
    </div>
  );
}
