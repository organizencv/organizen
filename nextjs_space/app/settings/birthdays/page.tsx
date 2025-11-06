
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Cake, Users, Eye, Bell, Save, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/back-button';

interface BirthdaySettings {
  enabled: boolean;
  visibility: 'ALL' | 'SAME_DEPARTMENT' | 'MANAGERS_ONLY';
  notifyBirthdayPerson: boolean;
  notifyTeamMembers: boolean;
  notifyManagers: boolean;
  customMessage: string | null;
}

export default function BirthdaySettingsPage() {
  const language = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<BirthdaySettings>({
    enabled: true,
    visibility: 'ALL',
    notifyBirthdayPerson: true,
    notifyTeamMembers: true,
    notifyManagers: true,
    customMessage: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/birthdays');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading birthday settings:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' 
          ? 'Erro ao carregar configurações' 
          : 'Error loading settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Guardando configurações:', settings);
      
      const response = await fetch('/api/settings/birthdays', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('✅ Configurações guardadas:', savedData);
        
        // Recarregar as configurações do servidor para confirmar
        await loadSettings();
        
        toast({
          title: language === 'pt' ? 'Sucesso' : 'Success',
          description: language === 'pt' 
            ? 'Configurações guardadas com sucesso' 
            : 'Settings saved successfully',
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Erro ao guardar:', errorData);
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving birthday settings:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' 
          ? 'Erro ao guardar configurações' 
          : 'Error saving settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <BackButton />
      
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Cake className="h-8 w-8" />
          {language === 'pt' ? 'Aniversários' : 'Birthdays'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'pt' 
            ? 'Configure as notificações e visibilidade dos aniversários' 
            : 'Configure birthday notifications and visibility'}
        </p>
      </div>

      {/* Ativação Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            {language === 'pt' ? 'Sistema de Aniversários' : 'Birthday System'}
          </CardTitle>
          <CardDescription>
            {language === 'pt' 
              ? 'Ativar ou desativar o sistema de celebração de aniversários' 
              : 'Enable or disable the birthday celebration system'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled" className="text-base">
                {language === 'pt' ? 'Sistema Ativo' : 'System Enabled'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' 
                  ? 'Ativar celebração automática de aniversários' 
                  : 'Enable automatic birthday celebrations'}
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Visibilidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {language === 'pt' ? 'Visibilidade' : 'Visibility'}
          </CardTitle>
          <CardDescription>
            {language === 'pt' 
              ? 'Defina quem pode ver os aniversários dos colaboradores' 
              : 'Define who can see employee birthdays'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="visibility">
              {language === 'pt' ? 'Quem vê os aniversários' : 'Who sees birthdays'}
            </Label>
            <Select
              value={settings.visibility}
              onValueChange={(value: any) => setSettings({ ...settings, visibility: value })}
              disabled={!settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {language === 'pt' ? 'Todos na empresa' : 'Everyone in the company'}
                </SelectItem>
                <SelectItem value="SAME_DEPARTMENT">
                  {language === 'pt' ? 'Apenas mesmo departamento' : 'Same department only'}
                </SelectItem>
                <SelectItem value="MANAGERS_ONLY">
                  {language === 'pt' ? 'Apenas gestores' : 'Managers only'}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.visibility === 'ALL' && (language === 'pt' 
                ? 'Todos os colaboradores verão os aniversários de todos' 
                : 'All employees will see everyone\'s birthdays')}
              {settings.visibility === 'SAME_DEPARTMENT' && (language === 'pt' 
                ? 'Colaboradores veem apenas aniversários do seu departamento' 
                : 'Employees see only birthdays from their department')}
              {settings.visibility === 'MANAGERS_ONLY' && (language === 'pt' 
                ? 'Apenas gestores, supervisores e administradores veem os aniversários' 
                : 'Only managers, supervisors and administrators see birthdays')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {language === 'pt' ? 'Notificações' : 'Notifications'}
          </CardTitle>
          <CardDescription>
            {language === 'pt' 
              ? 'Configure quem recebe notificações de aniversário' 
              : 'Configure who receives birthday notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifyBirthdayPerson">
                {language === 'pt' ? 'Notificar Aniversariante' : 'Notify Birthday Person'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' 
                  ? 'Enviar notificação de parabéns ao aniversariante' 
                  : 'Send congratulations notification to birthday person'}
              </p>
            </div>
            <Switch
              id="notifyBirthdayPerson"
              checked={settings.notifyBirthdayPerson}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyBirthdayPerson: checked })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifyTeamMembers">
                {language === 'pt' ? 'Notificar Membros da Equipa' : 'Notify Team Members'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' 
                  ? 'Notificar colegas do mesmo departamento/equipa' 
                  : 'Notify colleagues from same department/team'}
              </p>
            </div>
            <Switch
              id="notifyTeamMembers"
              checked={settings.notifyTeamMembers}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyTeamMembers: checked })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifyManagers">
                {language === 'pt' ? 'Notificar Gestores' : 'Notify Managers'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' 
                  ? 'Notificar supervisores, gestores e administradores' 
                  : 'Notify supervisors, managers and administrators'}
              </p>
            </div>
            <Switch
              id="notifyManagers"
              checked={settings.notifyManagers}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyManagers: checked })}
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mensagem Personalizada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {language === 'pt' ? 'Mensagem Personalizada' : 'Custom Message'}
          </CardTitle>
          <CardDescription>
            {language === 'pt' 
              ? 'Personalize a mensagem de parabéns (opcional)' 
              : 'Customize the congratulations message (optional)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={language === 'pt' 
              ? 'Ex: Feliz Aniversário! 🎉 Toda a equipa deseja-lhe um dia maravilhoso!' 
              : 'Ex: Happy Birthday! 🎉 The whole team wishes you a wonderful day!'}
            value={settings.customMessage || ''}
            onChange={(e) => setSettings({ ...settings, customMessage: e.target.value || null })}
            disabled={!settings.enabled}
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {language === 'pt' 
              ? 'Se deixar em branco, será usada a mensagem padrão' 
              : 'If left blank, the default message will be used'}
          </p>
        </CardContent>
      </Card>

      {/* Botão Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {language === 'pt' ? 'A guardar...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {language === 'pt' ? 'Guardar Configurações' : 'Save Settings'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
