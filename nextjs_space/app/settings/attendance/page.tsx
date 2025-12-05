
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, MapPin, Clock, Bell, Shield, Save } from 'lucide-react';
import { getTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

interface AttendanceSettings {
  id: string;
  companyId: string;
  requireGPS: boolean;
  maxGPSRadiusMeters: number;
  companyLatitude: number | null;
  companyLongitude: number | null;
  lateToleranceMinutes: number;
  earlyDepartureMinutes: number;
  allowManagerClockIn: boolean;
  allowSelfClockIn: boolean;
  notifyOnLate: boolean;
  notifyOnAbsent: boolean;
}

export default function AttendanceSettingsPage() {
  const { data: session } = useSession() || {};
  const language = (session?.user?.language || 'pt') as 'pt' | 'en' | 'es' | 'fr';
  
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    requireGPS: false,
    maxGPSRadiusMeters: 100,
    companyLatitude: 0,
    companyLongitude: 0,
    lateToleranceMinutes: 15,
    earlyDepartureMinutes: 15,
    allowManagerClockIn: true,
    allowSelfClockIn: true,
    notifyOnLate: true,
    notifyOnAbsent: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance-settings');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }

      const data = await response.json();
      setSettings(data);
      setFormData({
        requireGPS: data.requireGPS,
        maxGPSRadiusMeters: data.maxGPSRadiusMeters,
        companyLatitude: data.companyLatitude || 0,
        companyLongitude: data.companyLongitude || 0,
        lateToleranceMinutes: data.lateToleranceMinutes,
        earlyDepartureMinutes: data.earlyDepartureMinutes,
        allowManagerClockIn: data.allowManagerClockIn,
        allowSelfClockIn: data.allowSelfClockIn,
        notifyOnLate: data.notifyOnLate,
        notifyOnAbsent: data.notifyOnAbsent,
      });
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
      setError(error.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validações
      if (formData.maxGPSRadiusMeters < 10) {
        toast.error('Raio GPS deve ser no mínimo 10 metros');
        return;
      }

      if (formData.lateToleranceMinutes < 0 || formData.earlyDepartureMinutes < 0) {
        toast.error('Tolerâncias não podem ser negativas');
        return;
      }

      if (formData.requireGPS && (!formData.companyLatitude || !formData.companyLongitude)) {
        toast.error('Coordenadas da empresa são obrigatórias quando GPS está ativado');
        return;
      }

      const response = await fetch('/api/attendance-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao guardar configurações');
      }

      toast.success(getTranslation('attendanceSettingsSaved', language));
      fetchSettings();
    } catch (error: any) {
      console.error('Erro ao guardar:', error);
      toast.error(error.message || 'Erro ao guardar configurações');
    } finally {
      setSaving(false);
    }
  };

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

  if (error || !settings) {
    return (
      <div className="flex items-center gap-3 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-destructive">{getTranslation('errorOccurred', language)}</p>
          <p className="text-sm text-muted-foreground">{error || 'Configurações não encontradas'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {getTranslation('attendanceSettings', language)}
        </h1>
        <p className="text-muted-foreground mt-2">
          {getTranslation('configureAttendanceSettings', language)}
        </p>
      </div>

      {/* Configurações de Permissões */}
      <SettingsSection
        icon={Shield}
        title={getTranslation('permissionSettings', language)}
        description="Controle quem pode registar ponto no sistema"
      >
        <SettingsCard>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowManagerClockIn" className="text-base">
                  {getTranslation('allowManagerClockIn', language)}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que gestores registem ponto manualmente para funcionários
                </p>
              </div>
              <Switch
                id="allowManagerClockIn"
                checked={formData.allowManagerClockIn}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allowManagerClockIn: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowSelfClockIn" className="text-base">
                  {getTranslation('allowSelfClockIn', language)}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que funcionários registem o próprio ponto
                </p>
              </div>
              <Switch
                id="allowSelfClockIn"
                checked={formData.allowSelfClockIn}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allowSelfClockIn: checked })
                }
              />
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Configurações GPS */}
      <SettingsSection
        icon={MapPin}
        title={getTranslation('gpsSettings', language)}
        description="Configure validação de localização por GPS"
      >
        <SettingsCard>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireGPS" className="text-base">
                  {getTranslation('requireGPS', language)}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Validar localização GPS ao registar ponto
                </p>
              </div>
              <Switch
                id="requireGPS"
                checked={formData.requireGPS}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireGPS: checked })
                }
              />
            </div>

            {formData.requireGPS && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="maxGPSRadiusMeters">
                    {getTranslation('maxGPSRadius', language)} ({getTranslation('meters', language)})
                  </Label>
                  <Input
                    id="maxGPSRadiusMeters"
                    type="number"
                    min={10}
                    value={formData.maxGPSRadiusMeters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxGPSRadiusMeters: parseInt(e.target.value) || 100,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Distância máxima permitida da empresa (mínimo 10 metros)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyLatitude">
                      {getTranslation('latitude', language)}
                    </Label>
                    <Input
                      id="companyLatitude"
                      type="number"
                      step="0.000001"
                      value={formData.companyLatitude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          companyLatitude: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Ex: 14.916667"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyLongitude">
                      {getTranslation('longitude', language)}
                    </Label>
                    <Input
                      id="companyLongitude"
                      type="number"
                      step="0.000001"
                      value={formData.companyLongitude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          companyLongitude: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Ex: -23.550520"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Tolerâncias de Horário */}
      <SettingsSection
        icon={Clock}
        title={getTranslation('toleranceSettings', language)}
        description="Configure as tolerâncias de atraso e saída antecipada"
      >
        <SettingsCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="lateToleranceMinutes">
                {getTranslation('lateToleranceMinutes', language)} ({getTranslation('minutes', language)})
              </Label>
              <Input
                id="lateToleranceMinutes"
                type="number"
                min={0}
                value={formData.lateToleranceMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lateToleranceMinutes: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Minutos de tolerância antes de marcar atraso
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="earlyDepartureMinutes">
                {getTranslation('earlyDepartureMinutes', language)} ({getTranslation('minutes', language)})
              </Label>
              <Input
                id="earlyDepartureMinutes"
                type="number"
                min={0}
                value={formData.earlyDepartureMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    earlyDepartureMinutes: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Minutos de tolerância para saída antecipada
              </p>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Notificações */}
      <SettingsSection
        icon={Bell}
        title={getTranslation('notificationSettings', language)}
        description={getTranslation('notifyManagersDescription', language)}
      >
        <SettingsCard>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyOnLate" className="text-base">
                  {getTranslation('notifyOnLate', language)}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notificar gestores quando funcionários registam atraso
                </p>
              </div>
              <Switch
                id="notifyOnLate"
                checked={formData.notifyOnLate}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyOnLate: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyOnAbsent" className="text-base">
                  {getTranslation('notifyOnAbsent', language)}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notificar gestores quando funcionários não registam ponto
                </p>
              </div>
              <Switch
                id="notifyOnAbsent"
                checked={formData.notifyOnAbsent}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyOnAbsent: checked })
                }
              />
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Botão Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? getTranslation('loading', language) : getTranslation('save', language)}
        </Button>
      </div>
    </div>
  );
}
