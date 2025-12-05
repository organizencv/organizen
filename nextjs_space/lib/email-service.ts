
/**
 * Serviço de Email com Templates Personalizados
 * 
 * Este serviço processa templates de email com variáveis dinâmicas
 * e aplica o branding da empresa.
 */

import { prisma } from './db';

interface EmailTemplate {
  subject: string;
  body: string;
  enabled: boolean;
}

interface EmailOptions {
  to: string;
  variables: Record<string, string>;
}

export type EmailType = 'welcome' | 'reset' | 'invite' | 'notify';

/**
 * Processa um template substituindo variáveis {{nome}} por valores reais
 */
function processTemplate(template: string, variables: Record<string, string>): string {
  let processed = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value);
  });
  
  return processed;
}

/**
 * Busca o template de email configurado para a empresa
 */
async function getEmailTemplate(
  companyId: string,
  type: EmailType
): Promise<EmailTemplate | null> {
  try {
    const branding = await prisma.companyBranding.findUnique({
      where: { companyId },
      select: {
        emailSenderName: true,
        emailFooter: true,
        emailWelcomeSubject: true,
        emailWelcomeBody: true,
        emailWelcomeEnabled: true,
        emailResetSubject: true,
        emailResetBody: true,
        emailResetEnabled: true,
        emailInviteSubject: true,
        emailInviteBody: true,
        emailInviteEnabled: true,
        emailNotifySubject: true,
        emailNotifyBody: true,
        emailNotifyEnabled: true,
        primaryColor: true,
        logoUrl: true,
      },
    });

    if (!branding) return null;

    const templateMap: Record<EmailType, EmailTemplate> = {
      welcome: {
        subject: branding.emailWelcomeSubject || 'Bem-vindo(a)!',
        body: branding.emailWelcomeBody || '',
        enabled: branding.emailWelcomeEnabled ?? true,
      },
      reset: {
        subject: branding.emailResetSubject || 'Redefinir sua senha',
        body: branding.emailResetBody || '',
        enabled: branding.emailResetEnabled ?? true,
      },
      invite: {
        subject: branding.emailInviteSubject || 'Você foi convidado(a)',
        body: branding.emailInviteBody || '',
        enabled: branding.emailInviteEnabled ?? true,
      },
      notify: {
        subject: branding.emailNotifySubject || 'Notificação',
        body: branding.emailNotifyBody || '',
        enabled: branding.emailNotifyEnabled ?? true,
      },
    };

    const template = templateMap[type];
    
    if (!template.enabled) {
      console.log(`Template de email ${type} está desabilitado para empresa ${companyId}`);
      return null;
    }

    // Adiciona o rodapé ao corpo do email se existir
    if (branding.emailFooter) {
      template.body += `\n\n---\n${branding.emailFooter}`;
    }

    return template;
  } catch (error) {
    console.error('Erro ao buscar template de email:', error);
    return null;
  }
}

/**
 * Envia um email usando o template configurado
 * 
 * NOTA: Esta é uma implementação de demonstração.
 * Em produção, você deve integrar com um serviço real de envio de emails
 * como SendGrid, AWS SES, Mailgun, etc.
 */
export async function sendTemplatedEmail(
  companyId: string,
  type: EmailType,
  options: EmailOptions
): Promise<boolean> {
  try {
    // Busca o template
    const template = await getEmailTemplate(companyId, type);
    
    if (!template) {
      console.warn(`Template ${type} não encontrado ou desabilitado para empresa ${companyId}`);
      return false;
    }

    // Processa o template com as variáveis
    const subject = processTemplate(template.subject, options.variables);
    const body = processTemplate(template.body, options.variables);

    // Log para demonstração (em produção, envie o email real aqui)
    console.log('📧 Email a ser enviado:');
    console.log('Para:', options.to);
    console.log('Assunto:', subject);
    console.log('Corpo:', body);
    console.log('---');

    // TODO: Integrar com serviço de email real
    // Exemplo com SendGrid:
    // await sendgrid.send({
    //   to: options.to,
    //   from: process.env.EMAIL_FROM,
    //   subject,
    //   text: body,
    //   html: convertToHtml(body, branding),
    // });

    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Envia email de boas-vindas para novo usuário
 */
export async function sendWelcomeEmail(
  companyId: string,
  userEmail: string,
  userName: string,
  companyName: string
): Promise<boolean> {
  return sendTemplatedEmail(companyId, 'welcome', {
    to: userEmail,
    variables: {
      userName,
      userEmail,
      companyName,
      loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin`,
    },
  });
}

/**
 * Envia email de redefinição de senha
 */
export async function sendPasswordResetEmail(
  companyId: string,
  userEmail: string,
  userName: string,
  resetToken: string,
  companyName: string
): Promise<boolean> {
  const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
  
  return sendTemplatedEmail(companyId, 'reset', {
    to: userEmail,
    variables: {
      userName,
      resetLink,
      companyName,
      expiresIn: '24 horas',
    },
  });
}

/**
 * Envia convite para entrar na equipe
 */
export async function sendTeamInviteEmail(
  companyId: string,
  recipientEmail: string,
  inviterName: string,
  teamName: string,
  inviteToken: string,
  companyName: string
): Promise<boolean> {
  const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/accept-invite?token=${inviteToken}`;
  
  return sendTemplatedEmail(companyId, 'invite', {
    to: recipientEmail,
    variables: {
      inviterName,
      companyName,
      inviteLink,
      teamName,
    },
  });
}

/**
 * Envia notificação geral
 */
export async function sendNotificationEmail(
  companyId: string,
  userEmail: string,
  userName: string,
  notificationTitle: string,
  notificationBody: string,
  companyName: string
): Promise<boolean> {
  return sendTemplatedEmail(companyId, 'notify', {
    to: userEmail,
    variables: {
      userName,
      companyName,
      notificationTitle,
      notificationBody,
    },
  });
}
