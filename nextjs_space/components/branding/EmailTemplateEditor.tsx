
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Eye, Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EmailPreview from './EmailPreview';

interface EmailTemplate {
  type: 'welcome' | 'reset' | 'invite' | 'notify';
  subject: string;
  body: string;
  enabled: boolean;
}

interface EmailTemplateEditorProps {
  companyId: string;
  initialTemplates?: {
    emailSenderName?: string;
    emailFooter?: string;
    emailWelcomeSubject?: string;
    emailWelcomeBody?: string;
    emailWelcomeEnabled?: boolean;
    emailResetSubject?: string;
    emailResetBody?: string;
    emailResetEnabled?: boolean;
    emailInviteSubject?: string;
    emailInviteBody?: string;
    emailInviteEnabled?: boolean;
    emailNotifySubject?: string;
    emailNotifyBody?: string;
    emailNotifyEnabled?: boolean;
  };
  primaryColor?: string;
  logoUrl?: string;
}

const TEMPLATE_INFO = {
  welcome: {
    title: 'Email de Boas-vindas',
    description: 'Enviado quando um novo usuário se cadastra',
    variables: ['{{userName}}', '{{userEmail}}', '{{companyName}}', '{{loginUrl}}'],
  },
  reset: {
    title: 'Redefinição de Senha',
    description: 'Enviado quando o usuário solicita redefinir a senha',
    variables: ['{{userName}}', '{{resetLink}}', '{{companyName}}', '{{expiresIn}}'],
  },
  invite: {
    title: 'Convite para Equipe',
    description: 'Enviado ao convidar alguém para entrar na empresa',
    variables: ['{{inviterName}}', '{{companyName}}', '{{inviteLink}}', '{{teamName}}'],
  },
  notify: {
    title: 'Notificação Geral',
    description: 'Modelo base para notificações gerais',
    variables: ['{{userName}}', '{{companyName}}', '{{notificationTitle}}', '{{notificationBody}}'],
  },
};

export default function EmailTemplateEditor({
  companyId,
  initialTemplates,
  primaryColor,
  logoUrl,
}: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<'welcome' | 'reset' | 'invite' | 'notify'>('welcome');

  const [senderName, setSenderName] = useState(initialTemplates?.emailSenderName || '');
  const [footer, setFooter] = useState(initialTemplates?.emailFooter || '');

  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({
    welcome: {
      type: 'welcome',
      subject: initialTemplates?.emailWelcomeSubject || 'Bem-vindo(a) ao {{companyName}}!',
      body: initialTemplates?.emailWelcomeBody || getDefaultTemplate('welcome'),
      enabled: initialTemplates?.emailWelcomeEnabled ?? true,
    },
    reset: {
      type: 'reset',
      subject: initialTemplates?.emailResetSubject || 'Redefinir sua senha',
      body: initialTemplates?.emailResetBody || getDefaultTemplate('reset'),
      enabled: initialTemplates?.emailResetEnabled ?? true,
    },
    invite: {
      type: 'invite',
      subject: initialTemplates?.emailInviteSubject || 'Você foi convidado(a) para {{companyName}}',
      body: initialTemplates?.emailInviteBody || getDefaultTemplate('invite'),
      enabled: initialTemplates?.emailInviteEnabled ?? true,
    },
    notify: {
      type: 'notify',
      subject: initialTemplates?.emailNotifySubject || 'Notificação de {{companyName}}',
      body: initialTemplates?.emailNotifyBody || getDefaultTemplate('notify'),
      enabled: initialTemplates?.emailNotifyEnabled ?? true,
    },
  });

  const updateTemplate = (type: string, field: keyof EmailTemplate, value: any) => {
    setTemplates(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/branding/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          emailSenderName: senderName,
          emailFooter: footer,
          emailWelcomeSubject: templates.welcome.subject,
          emailWelcomeBody: templates.welcome.body,
          emailWelcomeEnabled: templates.welcome.enabled,
          emailResetSubject: templates.reset.subject,
          emailResetBody: templates.reset.body,
          emailResetEnabled: templates.reset.enabled,
          emailInviteSubject: templates.invite.subject,
          emailInviteBody: templates.invite.body,
          emailInviteEnabled: templates.invite.enabled,
          emailNotifySubject: templates.notify.subject,
          emailNotifyBody: templates.notify.body,
          emailNotifyEnabled: templates.notify.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar templates');
      }

      toast({
        title: 'Templates salvos!',
        description: 'Os templates de email foram atualizados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os templates. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const currentTemplate = templates[activeTemplate];
  const info = TEMPLATE_INFO[activeTemplate];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Templates de Email</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Ocultar' : 'Visualizar'}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Templates'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Estas configurações se aplicam a todos os emails enviados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderName">Nome do Remetente</Label>
            <Input
              id="senderName"
              placeholder="Ex: Equipe OrganiZen"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nome que aparecerá como remetente dos emails
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer">Rodapé do Email</Label>
            <Textarea
              id="footer"
              placeholder="Ex: © 2025 {{companyName}}. Todos os direitos reservados."
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Texto que aparecerá no final de todos os emails
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTemplate} onValueChange={(v) => setActiveTemplate(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="welcome">Boas-vindas</TabsTrigger>
          <TabsTrigger value="reset">Senha</TabsTrigger>
          <TabsTrigger value="invite">Convite</TabsTrigger>
          <TabsTrigger value="notify">Notificação</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTemplate} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{info.title}</CardTitle>
                  <CardDescription>{info.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${activeTemplate}-enabled`}>Ativo</Label>
                  <Switch
                    id={`${activeTemplate}-enabled`}
                    checked={currentTemplate.enabled}
                    onCheckedChange={(checked) =>
                      updateTemplate(activeTemplate, 'enabled', checked)
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Variáveis disponíveis:</strong>{' '}
                  {info.variables.join(', ')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor={`${activeTemplate}-subject`}>Assunto</Label>
                <Input
                  id={`${activeTemplate}-subject`}
                  value={currentTemplate.subject}
                  onChange={(e) =>
                    updateTemplate(activeTemplate, 'subject', e.target.value)
                  }
                  placeholder="Digite o assunto do email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${activeTemplate}-body`}>Corpo do Email</Label>
                <Textarea
                  id={`${activeTemplate}-body`}
                  value={currentTemplate.body}
                  onChange={(e) =>
                    updateTemplate(activeTemplate, 'body', e.target.value)
                  }
                  placeholder="Digite o conteúdo do email"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use as variáveis acima para personalizar o conteúdo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPreview && (
        <EmailPreview
          subject={currentTemplate.subject}
          body={currentTemplate.body}
          footer={footer}
          senderName={senderName}
          primaryColor={primaryColor}
          logoUrl={logoUrl}
          templateType={activeTemplate}
        />
      )}
    </div>
  );
}

function getDefaultTemplate(type: string): string {
  const templates = {
    welcome: `Olá {{userName}},

Bem-vindo(a) ao {{companyName}}! 🎉

Estamos muito felizes em tê-lo(a) conosco. Sua conta foi criada com sucesso e você já pode começar a usar nossa plataforma.

Para fazer login, acesse:
{{loginUrl}}

Email de acesso: {{userEmail}}

Se você tiver alguma dúvida, nossa equipe está pronta para ajudar.

Atenciosamente,
Equipe {{companyName}}`,

    reset: `Olá {{userName}},

Recebemos uma solicitação para redefinir a senha da sua conta no {{companyName}}.

Para criar uma nova senha, clique no link abaixo:
{{resetLink}}

Este link expira em {{expiresIn}}.

Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.

Atenciosamente,
Equipe {{companyName}}`,

    invite: `Olá!

{{inviterName}} convidou você para fazer parte da equipe "{{teamName}}" no {{companyName}}.

Para aceitar o convite e criar sua conta, clique no link abaixo:
{{inviteLink}}

Estamos ansiosos para tê-lo(a) em nosso time!

Atenciosamente,
Equipe {{companyName}}`,

    notify: `Olá {{userName}},

{{notificationTitle}}

{{notificationBody}}

Atenciosamente,
Equipe {{companyName}}`,
  };

  return templates[type as keyof typeof templates] || '';
}
