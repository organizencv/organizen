
'use client';

import { useEffect, useState } from 'react';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { CompanyInfoForm } from '@/components/settings/CompanyInfoForm';
import { BusinessHoursEditor } from '@/components/settings/BusinessHoursEditor';
import { FaviconUploader } from '@/components/settings/FaviconUploader';
import { PwaIconUploader } from '@/components/settings/PwaIconUploader';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Building2, Clock, Image } from 'lucide-react';
import { BackButton } from '@/components/back-button';

interface CompanyData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  defaultLanguage: string;
  favicon?: string;
  pwaIcon?: string;
  businessHours?: any;
}

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/company');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar informações');
      }

      const data = await response.json();
      setCompany(data);
    } catch (error: any) {
      console.error('Erro ao buscar empresa:', error);
      setError(error.message || 'Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex items-center gap-3 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Erro ao carregar informações</p>
          <p className="text-sm text-muted-foreground">{error || 'Empresa não encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="mb-3">
          <BackButton fallbackRoute="/settings" variant="ghost" />
        </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Informações da Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Configure as informações gerais da sua empresa, endereço, horários e recursos visuais
        </p>
      </div>

      {/* Informações Gerais */}
      <SettingsSection
        icon={Building2}
        title="Informações Gerais"
        description="Dados básicos da empresa, contato e endereço"
      >
        <SettingsCard>
          <CompanyInfoForm
            initialData={{
              name: company.name,
              email: company.email,
              phone: company.phone,
              website: company.website,
              address: company.address,
              city: company.city,
              state: company.state,
              country: company.country,
              postalCode: company.postalCode,
              taxId: company.taxId,
              defaultLanguage: company.defaultLanguage || 'pt',
            }}
            onSuccess={fetchCompany}
          />
        </SettingsCard>
      </SettingsSection>

      {/* Assets Visuais */}
      <SettingsSection
        icon={Image}
        title="Recursos Visuais"
        description="Personalize o favicon e ícone PWA da sua empresa"
      >
        <SettingsCard
          title="Favicon"
          description="Ícone que aparece na aba do navegador"
        >
          <FaviconUploader
            currentFavicon={company.favicon}
            onSuccess={fetchCompany}
          />
        </SettingsCard>

        <SettingsCard
          title="Ícone PWA"
          description="Ícone da aplicação quando instalada no dispositivo"
        >
          <PwaIconUploader
            currentIcon={company.pwaIcon}
            onSuccess={fetchCompany}
          />
        </SettingsCard>
      </SettingsSection>

      {/* Horário de Funcionamento */}
      <SettingsSection
        icon={Clock}
        title="Horário de Funcionamento"
        description="Configure os horários de funcionamento por dia da semana"
      >
        <SettingsCard>
          <BusinessHoursEditor
            initialHours={company.businessHours}
            onSuccess={fetchCompany}
          />
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
