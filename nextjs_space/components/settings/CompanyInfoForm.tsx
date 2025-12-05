
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Languages } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyData {
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
}

interface CompanyInfoFormProps {
  initialData: CompanyData;
  onSuccess?: () => void;
}

const languages = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];

export function CompanyInfoForm({ initialData, onSuccess }: CompanyInfoFormProps) {
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState<CompanyData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success('Informações atualizadas com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLanguage = async () => {
    setSyncing(true);

    try {
      const response = await fetch('/api/user/sync-language', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao sincronizar');
      }

      const data = await response.json();
      
      // Atualizar sessão com novo idioma
      await update({
        language: data.language,
      });

      toast.success('Idioma sincronizado com sucesso!');
      
      // Recarregar página para aplicar o novo idioma
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao sincronizar idioma:', error);
      toast.error(error.message || 'Erro ao sincronizar idioma');
    } finally {
      setSyncing(false);
    }
  };

  const handleChange = (field: keyof CompanyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Gerais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informações Gerais</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome da Empresa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Corporativo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+351 123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">CNPJ / NIF</Label>
            <Input
              id="taxId"
              value={formData.taxId || ''}
              onChange={(e) => handleChange('taxId', e.target.value)}
              placeholder="123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultLanguage">Idioma Padrão</Label>
            <Select
              value={formData.defaultLanguage}
              onValueChange={(value) => handleChange('defaultLanguage', value)}
            >
              <SelectTrigger id="defaultLanguage">
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Idioma padrão para novos usuários e documentos da empresa
            </p>
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Endereço</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="address">Rua / Avenida</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua Example, 123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Lisboa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado / Região</Label>
            <Input
              id="state"
              value={formData.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="Lisboa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              value={formData.country || ''}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Portugal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Código Postal</Label>
            <Input
              id="postalCode"
              value={formData.postalCode || ''}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="1000-100"
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleSyncLanguage}
          disabled={syncing || loading}
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Languages className="mr-2 h-4 w-4" />
              Aplicar Idioma ao Meu Perfil
            </>
          )}
        </Button>

        <Button type="submit" disabled={loading || syncing}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
