
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { Loader2, Cake, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BirthdaySettings {
  id: string;
  enabled: boolean;
  messageTemplate: string;
  sendTime: string;
  notifyBirthdayPerson: boolean;
  notifyManagers: boolean;
  notifyTeamMembers: boolean;
  visibility: string;
}

export default function BirthdaySettingsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BirthdaySettings | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      toast.error('Acesso negado: Apenas administradores');
      return;
    }

    loadSettings();
  }, [status, session, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/birthday');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/birthday', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar configurações. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Cake className="h-7 w-7 text-primary" />
            Mensagens Automáticas de Aniversário
          </div>
        }
        showBackButton={true}
        backUrl="/settings"
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </PageHeader>

      <p className="text-muted-foreground -mt-2">
        Configure as mensagens automáticas de parabéns para colaboradores
      </p>

      <div className="grid gap-6">
        {/* Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle>Status Geral</CardTitle>
            <CardDescription>
              Ativar ou desativar as mensagens automáticas de aniversário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Sistema de Mensagens de Aniversário</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.enabled ? 'Ativado' : 'Desativado'}
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Template de Mensagem */}
        <Card>
          <CardHeader>
            <CardTitle>Template de Mensagem</CardTitle>
            <CardDescription>
              Personalize a mensagem enviada aos aniversariantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="messageTemplate">Mensagem Personalizada</Label>
              <Textarea
                id="messageTemplate"
                value={settings.messageTemplate || ''}
                onChange={(e) => 
                  setSettings({ ...settings, messageTemplate: e.target.value })
                }
                rows={6}
                placeholder="🎉 Feliz Aniversário, {{name}}! 🎂"
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Variáveis disponíveis: <code className="text-xs bg-muted px-2 py-1 rounded">{'{{name}}'}</code>, 
                <code className="text-xs bg-muted px-2 py-1 rounded ml-2">{'{{companyName}}'}</code>, 
                <code className="text-xs bg-muted px-2 py-1 rounded ml-2">{'{{age}}'}</code>, 
                <code className="text-xs bg-muted px-2 py-1 rounded ml-2">{'{{teamName}}'}</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sendTime">Horário de Envio</Label>
              <Input
                id="sendTime"
                type="time"
                value={settings.sendTime}
                onChange={(e) => 
                  setSettings({ ...settings, sendTime: e.target.value })
                }
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Horário em que as mensagens serão enviadas (formato 24h)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle>Destinatários das Notificações</CardTitle>
            <CardDescription>
              Escolha quem receberá as notificações de aniversário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notificar a pessoa do aniversário</Label>
                <p className="text-sm text-muted-foreground">
                  O aniversariante receberá a mensagem
                </p>
              </div>
              <Switch
                checked={settings.notifyBirthdayPerson}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, notifyBirthdayPerson: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notificar gestores</Label>
                <p className="text-sm text-muted-foreground">
                  Administradores, gerentes e supervisores serão notificados
                </p>
              </div>
              <Switch
                checked={settings.notifyManagers}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, notifyManagers: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notificar membros da equipe</Label>
                <p className="text-sm text-muted-foreground">
                  Todos os membros da equipe do aniversariante serão notificados
                </p>
              </div>
              <Switch
                checked={settings.notifyTeamMembers}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, notifyTeamMembers: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Visibilidade */}
        <Card>
          <CardHeader>
            <CardTitle>Visibilidade</CardTitle>
            <CardDescription>
              Controle quem pode ver as mensagens de aniversário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="visibility">Nível de Privacidade</Label>
              <Select
                value={settings.visibility}
                onValueChange={(value) => 
                  setSettings({ ...settings, visibility: value })
                }
              >
                <SelectTrigger id="visibility" className="max-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    Público - Todos podem ver no chat geral
                  </SelectItem>
                  <SelectItem value="TEAM_ONLY">
                    Apenas Equipe - Somente membros da equipe veem
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    Privado - Apenas notificações, sem mensagem pública
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Define quem pode visualizar as mensagens de aniversário no sistema
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Como funciona:</strong> O sistema verifica diariamente às {settings.sendTime} se há aniversariantes. 
            As notificações são enviadas automaticamente conforme as configurações acima. 
            Certifique-se de que os utilizadores tenham a data de nascimento preenchida no perfil.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
