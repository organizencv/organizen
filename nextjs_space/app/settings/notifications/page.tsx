

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Bell, Mail, TestTube } from 'lucide-react';
import { PushNotificationManager } from '@/components/push-notification-manager';

interface NotificationPreferences {
  // Email
  emailOnTaskAssigned: boolean;
  emailOnTaskCompleted: boolean;
  emailOnTaskComment: boolean;
  emailOnMention: boolean;
  emailOnDeadline: boolean;
  emailOnShiftAssigned: boolean;
  emailOnShiftSwap: boolean;
  emailOnTimeOff: boolean;
  emailOnMessage: boolean;
  
  // Push
  pushEnabled: boolean;
  pushOnTaskAssigned: boolean;
  pushOnTaskComment: boolean;
  pushOnMention: boolean;
  pushOnMessage: boolean;
  pushOnShiftSwap: boolean;
  pushOnTimeOff: boolean;
  
  // Digests
  dailyDigest: boolean;
  weeklyDigest: boolean;
  monthlyDigest: boolean;
}

export default function NotificationsSettingsPage() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [session]);

  const fetchPreferences = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/settings/notifications');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Erro ao carregar preferências');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Preferências salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar preferências');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  const testPushNotification = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/push-subscription/test', {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Notificação de teste enviada! Verifique seu dispositivo.');
      } else {
        toast.error('Erro ao enviar notificação de teste');
      }
    } catch (error) {
      console.error('Error testing push:', error);
      toast.error('Erro ao enviar notificação de teste');
    } finally {
      setTesting(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">Erro ao carregar preferências de notificações.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notificações</h1>
        <p className="text-muted-foreground">
          Configure como você deseja receber notificações
        </p>
      </div>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações Push
              </CardTitle>
              <CardDescription>
                Receba notificações em tempo real, mesmo com o app fechado
              </CardDescription>
            </div>
            <PushNotificationManager showButton={true} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar notificações push globalmente
              </p>
            </div>
            <Switch
              checked={preferences.pushEnabled}
              onCheckedChange={(checked) => updatePreference('pushEnabled', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Receber notificações push para:</h4>
            
            <div className="flex items-center justify-between">
              <Label className="font-normal">Novas tarefas atribuídas</Label>
              <Switch
                checked={preferences.pushOnTaskAssigned}
                onCheckedChange={(checked) => updatePreference('pushOnTaskAssigned', checked)}
                disabled={!preferences.pushEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="font-normal">Comentários em tarefas</Label>
              <Switch
                checked={preferences.pushOnTaskComment}
                onCheckedChange={(checked) => updatePreference('pushOnTaskComment', checked)}
                disabled={!preferences.pushEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="font-normal">Menções</Label>
              <Switch
                checked={preferences.pushOnMention}
                onCheckedChange={(checked) => updatePreference('pushOnMention', checked)}
                disabled={!preferences.pushEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="font-normal">Novas mensagens</Label>
              <Switch
                checked={preferences.pushOnMessage}
                onCheckedChange={(checked) => updatePreference('pushOnMessage', checked)}
                disabled={!preferences.pushEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="font-normal">Pedidos de troca de turno</Label>
              <Switch
                checked={preferences.pushOnShiftSwap}
                onCheckedChange={(checked) => updatePreference('pushOnShiftSwap', checked)}
                disabled={!preferences.pushEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="font-normal">Pedidos de folga</Label>
              <Switch
                checked={preferences.pushOnTimeOff}
                onCheckedChange={(checked) => updatePreference('pushOnTimeOff', checked)}
                disabled={!preferences.pushEnabled}
              />
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            onClick={testPushNotification}
            disabled={testing || !preferences.pushEnabled}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Enviando...' : 'Testar Notificação Push'}
          </Button>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificações por Email
          </CardTitle>
          <CardDescription>
            Configure quando você deseja receber emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-normal">Novas tarefas atribuídas</Label>
            <Switch
              checked={preferences.emailOnTaskAssigned}
              onCheckedChange={(checked) => updatePreference('emailOnTaskAssigned', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-normal">Tarefas concluídas</Label>
            <Switch
              checked={preferences.emailOnTaskCompleted}
              onCheckedChange={(checked) => updatePreference('emailOnTaskCompleted', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-normal">Comentários em tarefas</Label>
            <Switch
              checked={preferences.emailOnTaskComment}
              onCheckedChange={(checked) => updatePreference('emailOnTaskComment', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-normal">Menções</Label>
            <Switch
              checked={preferences.emailOnMention}
              onCheckedChange={(checked) => updatePreference('emailOnMention', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-normal">Lembretes de prazo</Label>
            <Switch
              checked={preferences.emailOnDeadline}
              onCheckedChange={(checked) => updatePreference('emailOnDeadline', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-normal">Turnos atribuídos</Label>
            <Switch
              checked={preferences.emailOnShiftAssigned}
              onCheckedChange={(checked) => updatePreference('emailOnShiftAssigned', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-normal">Pedidos de troca de turno</Label>
            <Switch
              checked={preferences.emailOnShiftSwap}
              onCheckedChange={(checked) => updatePreference('emailOnShiftSwap', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-normal">Pedidos de folga</Label>
            <Switch
              checked={preferences.emailOnTimeOff}
              onCheckedChange={(checked) => updatePreference('emailOnTimeOff', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-normal">Novas mensagens</Label>
            <Switch
              checked={preferences.emailOnMessage}
              onCheckedChange={(checked) => updatePreference('emailOnMessage', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumos Periódicos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumos Periódicos</CardTitle>
          <CardDescription>
            Receba resumos das suas atividades por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumo Diário</Label>
              <p className="text-sm text-muted-foreground">
                Receba um resumo todos os dias
              </p>
            </div>
            <Switch
              checked={preferences.dailyDigest}
              onCheckedChange={(checked) => updatePreference('dailyDigest', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumo Semanal</Label>
              <p className="text-sm text-muted-foreground">
                Receba um resumo toda semana
              </p>
            </div>
            <Switch
              checked={preferences.weeklyDigest}
              onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumo Mensal</Label>
              <p className="text-sm text-muted-foreground">
                Receba um resumo todo mês
              </p>
            </div>
            <Switch
              checked={preferences.monthlyDigest}
              onCheckedChange={(checked) => updatePreference('monthlyDigest', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Salvar */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </div>
    </div>
  );
}
