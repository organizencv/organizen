
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Lock, Clock, UserCheck, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { BackButton } from '@/components/back-button';

interface SecuritySettings {
  id: string;
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpirationDays: number | null;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  requireApproval: boolean;
  autoApproveEmails: string[];
  defaultRole: string;
  defaultPermissions: any;
}

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [testPassword, setTestPassword] = useState('');
  const [testResult, setTestResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [showTestPassword, setShowTestPassword] = useState(false);
  const [emailsInput, setEmailsInput] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      toast({
        title: 'Acesso Negado',
        description: 'Apenas administradores podem acessar esta página',
        variant: 'destructive',
      });
    } else if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, session, router, toast]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/security');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setEmailsInput(data.autoApproveEmails?.join('\n') || '');
      } else {
        throw new Error('Erro ao buscar configurações');
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações de segurança',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          autoApproveEmails: emailsInput.split('\n').filter(email => email.trim()),
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        toast({
          title: 'Sucesso',
          description: 'Configurações de segurança atualizadas',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar configurações');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPassword = async () => {
    if (!testPassword) return;

    try {
      const response = await fetch('/api/settings/security/test-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: testPassword }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
      }
    } catch (error) {
      console.error('Erro ao testar senha:', error);
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <BackButton fallbackRoute="/settings" variant="ghost" />
        </div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Configurações de Segurança
        </h2>
        <p className="text-muted-foreground mt-1">
          Gerir políticas de senha, sessões e aprovações de usuários
        </p>
      </div>

      {/* Políticas de Senha */}
      <SettingsCard
        icon={<Lock className="h-5 w-5" />}
        title="Políticas de Senha"
        description="Definir requisitos de complexidade e expiração"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="minPasswordLength">Tamanho Mínimo</Label>
            <Input
              id="minPasswordLength"
              type="number"
              min={4}
              max={128}
              value={settings.minPasswordLength}
              onChange={(e) =>
                setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) || 8 })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">Entre 4 e 128 caracteres</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="requireUppercase">Exigir Letras Maiúsculas</Label>
              <Switch
                id="requireUppercase"
                checked={settings.requireUppercase}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireUppercase: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requireLowercase">Exigir Letras Minúsculas</Label>
              <Switch
                id="requireLowercase"
                checked={settings.requireLowercase}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireLowercase: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requireNumbers">Exigir Números</Label>
              <Switch
                id="requireNumbers"
                checked={settings.requireNumbers}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireNumbers: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requireSpecialChars">Exigir Caracteres Especiais</Label>
              <Switch
                id="requireSpecialChars"
                checked={settings.requireSpecialChars}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireSpecialChars: checked })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="passwordExpirationDays">Expiração de Senha (dias)</Label>
            <Input
              id="passwordExpirationDays"
              type="number"
              min={0}
              placeholder="Deixe vazio para nunca expirar"
              value={settings.passwordExpirationDays || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  passwordExpirationDays: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe vazio para que senhas nunca expirem
            </p>
          </div>

          {/* Testar Senha */}
          <div className="border-t pt-4">
            <Label htmlFor="testPassword">Testar Senha Contra Políticas</Label>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Input
                  id="testPassword"
                  type={showTestPassword ? 'text' : 'password'}
                  placeholder="Digite uma senha para testar"
                  value={testPassword}
                  onChange={(e) => {
                    setTestPassword(e.target.value);
                    setTestResult(null);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowTestPassword(!showTestPassword)}
                >
                  {showTestPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleTestPassword} disabled={!testPassword}>
                Testar
              </Button>
            </div>

            {testResult && (
              <Alert className={`mt-3 ${testResult.valid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="flex items-start gap-2">
                  {testResult.valid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${testResult.valid ? 'text-green-900' : 'text-red-900'}`}>
                      {testResult.valid ? 'Senha válida!' : 'Senha inválida'}
                    </p>
                    {!testResult.valid && testResult.errors.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-red-800">
                        {testResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* Sessões */}
      <SettingsCard
        icon={<Clock className="h-5 w-5" />}
        title="Gestão de Sessões"
        description="Controlar timeout e sessões concorrentes"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="sessionTimeoutMinutes">Timeout de Sessão (minutos)</Label>
            <Input
              id="sessionTimeoutMinutes"
              type="number"
              min={5}
              max={10080}
              value={settings.sessionTimeoutMinutes}
              onChange={(e) =>
                setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 480 })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Entre 5 minutos e 7 dias (10080 minutos)
            </p>
          </div>

          <div>
            <Label htmlFor="maxConcurrentSessions">Máximo de Sessões Concorrentes</Label>
            <Input
              id="maxConcurrentSessions"
              type="number"
              min={1}
              max={10}
              value={settings.maxConcurrentSessions}
              onChange={(e) =>
                setSettings({ ...settings, maxConcurrentSessions: parseInt(e.target.value) || 3 })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">Entre 1 e 10 sessões</p>
          </div>
        </div>
      </SettingsCard>

      {/* Aprovação de Usuários */}
      <SettingsCard
        icon={<UserCheck className="h-5 w-5" />}
        title="Aprovação de Novos Usuários"
        description="Controlar o acesso de novos registos"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requireApproval">Exigir Aprovação Manual</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Novos usuários precisam de aprovação de um administrador
              </p>
            </div>
            <Switch
              id="requireApproval"
              checked={settings.requireApproval}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireApproval: checked })
              }
            />
          </div>

          <div>
            <Label htmlFor="autoApproveEmails">Emails/Domínios Auto-aprovados</Label>
            <Textarea
              id="autoApproveEmails"
              placeholder="exemplo@empresa.com&#10;@empresa.com&#10;user@example.com"
              rows={4}
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Um email ou domínio por linha. Use @dominio.com para aprovar todo o domínio
            </p>
          </div>

          <div>
            <Label htmlFor="defaultRole">Cargo Padrão para Novos Usuários</Label>
            <Select
              value={settings.defaultRole}
              onValueChange={(value) => setSettings({ ...settings, defaultRole: value })}
            >
              <SelectTrigger id="defaultRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Cargo atribuído automaticamente a novos usuários aprovados
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? 'A guardar...' : 'Guardar Configurações'}
        </Button>
      </div>
    </div>
  );
}
