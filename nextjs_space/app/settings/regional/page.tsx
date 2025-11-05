

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { TimezonePicker } from '@/components/settings/TimezonePicker';
import { DateFormatSelector } from '@/components/settings/DateFormatSelector';
import { TimeFormatSelector } from '@/components/settings/TimeFormatSelector';
import { FirstDaySelector } from '@/components/settings/FirstDaySelector';
import { CurrencySelector } from '@/components/settings/CurrencySelector';
import { Globe, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { getTranslation } from '@/lib/i18n';

interface RegionalSettings {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number;
  currency: string;
}

export default function RegionalSettingsPage() {
  const { data: session } = useSession() || {};
  const language = useLanguage();
  const t = (key: string) => getTranslation(key as any, language);
  const [settings, setSettings] = useState<RegionalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Estado inicial para comparação
  const [initialSettings, setInitialSettings] = useState<RegionalSettings | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/regional');
      
      if (!response.ok) {
        throw new Error(t('errorLoadingSettings'));
      }

      const data = await response.json();
      setSettings(data);
      setInitialSettings(data);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Erro ao buscar configurações regionais:', error);
      toast.error(t('regionalSettingsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: keyof RegionalSettings, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);

    // Verificar se há mudanças
    const changed = initialSettings ? JSON.stringify(newSettings) !== JSON.stringify(initialSettings) : false;
    setHasChanges(changed);
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/regional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('errorSavingSettings'));
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setInitialSettings(updatedSettings);
      setHasChanges(false);
      toast.success(t('settingsSavedSuccess'));
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || t('errorSavingSettings'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialSettings) {
      setSettings(initialSettings);
      setHasChanges(false);
      toast.info(t('changesDiscarded'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('regionalSettingsTitle')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('regionalSettingsConfig')}
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('regionalSettingsError')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-3">
          <BackButton fallbackRoute="/settings" variant="ghost" />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('regionalSettingsTitle')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('regionalSettingsConfig')}
        </p>
      </div>

      {/* Alerta de Permissão */}
      {!isAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('onlyAdminsCanChange')}
          </AlertDescription>
        </Alert>
      )}

      {/* Fuso Horário */}
      <SettingsSection
        title={t('timezone')}
        description={t('timezoneDesc')}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('timezoneConfig')}</CardTitle>
            <CardDescription>
              {t('timezoneDisplayDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimezonePicker
              value={settings.timezone}
              onChange={(value) => handleChange('timezone', value)}
            />
          </CardContent>
        </Card>
      </SettingsSection>

      {/* Formato de Data e Hora */}
      <SettingsSection
        title={t('dateTimeFormat')}
        description={t('dateTimeFormatDesc')}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('presentationFormats')}</CardTitle>
            <CardDescription>
              {t('chooseDateTimeFormat')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DateFormatSelector
              value={settings.dateFormat}
              onChange={(value) => handleChange('dateFormat', value)}
            />
            <div className="border-t pt-6">
              <TimeFormatSelector
                value={settings.timeFormat}
                onChange={(value) => handleChange('timeFormat', value)}
              />
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      {/* Calendário */}
      <SettingsSection
        title={t('calendar')}
        description={t('firstDayOfWeek')}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('calendar')}</CardTitle>
            <CardDescription>
              {t('firstDayOfWeek')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FirstDaySelector
              value={settings.firstDayOfWeek}
              onChange={(value) => handleChange('firstDayOfWeek', value)}
            />
          </CardContent>
        </Card>
      </SettingsSection>

      {/* Moeda */}
      <SettingsSection
        title={t('currencyFormat')}
        description={t('currencyFormatDesc')}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('companyCurrency')}</CardTitle>
            <CardDescription>
              {t('selectCurrency')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencySelector
              value={settings.currency}
              onChange={(value) => handleChange('currency', value)}
            />
          </CardContent>
        </Card>
      </SettingsSection>

      {/* Ações */}
      {isAdmin && hasChanges && (
        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-background/95 backdrop-blur p-4 rounded-lg border shadow-lg">
          <Alert className="flex-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('discardChanges')}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            {t('cancelChanges')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('loading')}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('saveChanges')}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
