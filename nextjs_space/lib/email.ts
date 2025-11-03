
import { Resend } from 'resend';
import { prisma } from './db';

const resend = new Resend(process.env.RESEND_API_KEY);

// Função para substituir variáveis dinâmicas no template
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key]);
  });
  return result;
}

// Função para buscar templates de email do branding da empresa
async function getEmailTemplates(companyId: string) {
  const branding = await prisma.companyBranding.findUnique({
    where: { companyId },
    select: {
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
      emailSenderName: true,
      emailFooter: true,
    }
  });

  return branding;
}

// Função para buscar branding da empresa
async function getCompanyBranding(companyId: string) {
  const branding = await prisma.companyBranding.findUnique({
    where: { companyId }
  });

  return branding;
}

// Função para renderizar HTML do email com branding
function renderEmailHTML(
  subject: string,
  body: string,
  branding: any
): string {
  const primaryColor = branding?.primaryColor || '#3b82f6';
  const secondaryColor = branding?.secondaryColor || '#8b5cf6';
  const companyName = branding?.companyName || 'OrganiZen';
  
  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); border-radius: 8px 8px 0 0;">
              ${branding?.logoUrl ? `
                <img src="${branding.logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto; margin-bottom: 20px;" />
              ` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${companyName}</h1>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${body.split('\n').map(line => `<p style="margin: 0 0 16px 0;">${line}</p>`).join('')}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ${branding?.customFooterMessage || 'Este é um email automático do sistema OrganiZen.'}
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

interface SendEmailParams {
  to: string;
  companyId: string;
  templateType: 'WELCOME' | 'PASSWORD_RESET' | 'TEAM_INVITE' | 'NOTIFICATION';
  variables: Record<string, string>;
  from?: string;
}

// Função principal para enviar emails
export async function sendEmail({
  to,
  companyId,
  templateType,
  variables,
  from = 'noreply@organizen.app'
}: SendEmailParams) {
  try {
    // Buscar templates de email do branding
    const templates = await getEmailTemplates(companyId);
    
    // Buscar branding da empresa
    const branding = await getCompanyBranding(companyId);
    
    // Determinar subject e body baseado no tipo
    let subject = '';
    let body = '';
    let enabled = true;
    
    if (templates) {
      switch (templateType) {
        case 'WELCOME':
          subject = templates.emailWelcomeSubject || `Bem-vindo ao ${variables.companyName || 'OrganiZen'}!`;
          body = templates.emailWelcomeBody || `Olá ${variables.userName},\n\nBem-vindo ao ${variables.companyName || 'OrganiZen'}!\n\nEstamos felizes em tê-lo(a) conosco. Sua conta foi criada com sucesso.\n\nEmail: ${variables.userEmail}\n\nVocê já pode fazer login e começar a usar a plataforma.\n\nAtenciosamente,\nEquipe ${variables.companyName || 'OrganiZen'}`;
          enabled = templates.emailWelcomeEnabled;
          break;
        case 'PASSWORD_RESET':
          subject = templates.emailResetSubject || 'Redefinir sua senha';
          body = templates.emailResetBody || `Olá ${variables.userName},\n\nRecebemos uma solicitação para redefinir sua senha.\n\nClique no link abaixo para criar uma nova senha:\n${variables.resetLink}\n\nEste link expira em 1 hora.\n\nSe você não solicitou esta alteração, ignore este email.\n\nAtenciosamente,\nEquipe ${variables.companyName || 'OrganiZen'}`;
          enabled = templates.emailResetEnabled;
          break;
        case 'TEAM_INVITE':
          subject = templates.emailInviteSubject || `Você foi convidado para ${variables.teamName}`;
          body = templates.emailInviteBody || `Olá ${variables.userName},\n\n${variables.inviterName} convidou você para fazer parte da equipe "${variables.teamName}" no ${variables.companyName || 'OrganiZen'}.\n\nClique no link abaixo para aceitar o convite:\n${variables.inviteLink}\n\nAtenciosamente,\nEquipe ${variables.companyName || 'OrganiZen'}`;
          enabled = templates.emailInviteEnabled;
          break;
        case 'NOTIFICATION':
          subject = templates.emailNotifySubject || variables.notificationTitle || 'Nova notificação';
          body = templates.emailNotifyBody || `Olá ${variables.userName},\n\n${variables.notificationMessage}\n\nAtenciosamente,\nEquipe ${variables.companyName || 'OrganiZen'}`;
          enabled = templates.emailNotifyEnabled;
          break;
      }
    } else {
      // Templates padrão se não houver branding
      switch (templateType) {
        case 'WELCOME':
          subject = `Bem-vindo ao ${variables.companyName || 'OrganiZen'}!`;
          body = `Olá ${variables.userName},\n\nBem-vindo ao ${variables.companyName || 'OrganiZen'}!\n\nEstamos felizes em tê-lo(a) conosco. Sua conta foi criada com sucesso.\n\nEmail: ${variables.userEmail}\n\nVocê já pode fazer login e começar a usar a plataforma.\n\nAtenciosamente,\nEquipe ${variables.companyName || 'OrganiZen'}`;
          break;
        case 'PASSWORD_RESET':
          subject = 'Redefinir sua senha';
          body = `Olá ${variables.userName},\n\nRecebemos uma solicitação para redefinir sua senha.\n\nClique no link abaixo para criar uma nova senha:\n${variables.resetLink}\n\nEste link expira em 1 hora.\n\nSe você não solicitou esta alteração, ignore este email.\n\nAtenciosamente,\nEquipe ${variables.companyName || 'OrganiZen'}`;
          break;
        case 'TEAM_INVITE':
          subject = `Você foi convidado para ${variables.teamName}`;
          body = `Olá ${variables.userName},\n\n${variables.inviterName} convidou você para fazer parte da equipe "${variables.teamName}" no ${variables.companyName || 'OrganiZen'}.\n\nClique no link abaixo para aceitar o convite:\n${variables.inviteLink}\n\nAtenciosamente,\nEquipe ${variables.companyName || 'OrganiZen'}`;
          break;
        case 'NOTIFICATION':
          subject = variables.notificationTitle || 'Nova notificação';
          body = `Olá ${variables.userName},\n\n${variables.notificationMessage}\n\nAtenciosamente,\nEquipe ${variables.companyName || 'OrganiZen'}`;
          break;
      }
    }
    
    // Se o template estiver desabilitado, não enviar
    if (!enabled) {
      console.log('⏭️  Email não enviado - template desabilitado:', templateType);
      return { success: true, skipped: true };
    }
    
    // Substituir variáveis
    subject = replaceVariables(subject, variables);
    body = replaceVariables(body, variables);
    
    // Renderizar HTML com branding
    const html = renderEmailHTML(subject, body, branding);
    
    // Enviar email via Resend
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html
    });
    
    console.log('✅ Email enviado com sucesso:', result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, error };
  }
}

// Funções específicas para cada tipo de email

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  companyId: string,
  companyName: string
) {
  return sendEmail({
    to: userEmail,
    companyId,
    templateType: 'WELCOME',
    variables: {
      userName,
      userEmail,
      companyName
    }
  });
}

export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  companyId: string,
  companyName: string,
  resetLink: string
) {
  return sendEmail({
    to: userEmail,
    companyId,
    templateType: 'PASSWORD_RESET',
    variables: {
      userName,
      userEmail,
      companyName,
      resetLink
    }
  });
}

export async function sendTeamInviteEmail(
  userEmail: string,
  userName: string,
  companyId: string,
  companyName: string,
  teamName: string,
  inviterName: string,
  inviteLink: string
) {
  return sendEmail({
    to: userEmail,
    companyId,
    templateType: 'TEAM_INVITE',
    variables: {
      userName,
      userEmail,
      companyName,
      teamName,
      inviterName,
      inviteLink
    }
  });
}

export async function sendNotificationEmail(
  userEmail: string,
  userName: string,
  companyId: string,
  companyName: string,
  notificationTitle: string,
  notificationMessage: string
) {
  return sendEmail({
    to: userEmail,
    companyId,
    templateType: 'NOTIFICATION',
    variables: {
      userName,
      userEmail,
      companyName,
      notificationTitle,
      notificationMessage
    }
  });
}

// Interface para o resumo
interface UserDigest {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  summary: {
    tasksCreated: number;
    tasksCompleted: number;
    messagesReceived: number;
    messagesUnread: number;
    shiftsScheduled: number;
    shiftSwapRequests: number;
    timeOffRequests: number;
  };
  tasks: any[];
  messages: any[];
  shifts: any[];
  shiftSwapRequests: any[];
  timeOffRequests: any[];
}

/**
 * Envia email de resumo (digest) para o usuário
 */
export async function sendDigestEmail(
  userEmail: string,
  userName: string,
  companyId: string,
  digest: UserDigest
) {
  try {
    // Buscar dados da empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true }
    });

    // Buscar branding da empresa
    const branding = await getCompanyBranding(companyId);
    const companyName = company?.name || 'OrganiZen';
    const primaryColor = branding?.primaryColor || '#3b82f6';
    const secondaryColor = branding?.secondaryColor || '#8b5cf6';

    // Determinar labels baseado no período
    const periodLabels = {
      daily: { pt: 'Diário', en: 'Daily' },
      weekly: { pt: 'Semanal', en: 'Weekly' },
      monthly: { pt: 'Mensal', en: 'Monthly' }
    };

    const periodLabel = periodLabels[digest.period].pt;

    // Formatar datas
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const startDateFormatted = formatDate(digest.startDate);
    const endDateFormatted = formatDate(digest.endDate);

    // Subject do email
    const subject = `📊 Resumo ${periodLabel} - ${companyName}`;

    // Construir HTML do email
    const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header com gradiente -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); border-radius: 8px 8px 0 0;">
              ${branding?.logoUrl ? `
                <img src="${branding.logoUrl}" alt="${companyName}" style="max-width: 120px; height: auto; margin-bottom: 20px;" />
              ` : ''}
              <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 28px; font-weight: 600;">📊 Resumo ${periodLabel}</h1>
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">${startDateFormatted} - ${endDateFormatted}</p>
            </td>
          </tr>
          
          <!-- Saudação -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">Olá ${userName},</p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">Aqui está o seu resumo de atividades do período.</p>
            </td>
          </tr>

          <!-- Estatísticas -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 15px; text-align: center; background-color: #f9fafb; border-radius: 8px; width: 33%;">
                    <div style="font-size: 28px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px;">${digest.summary.tasksCreated}</div>
                    <div style="font-size: 12px; color: #6b7280;">Tarefas Criadas</div>
                  </td>
                  <td style="width: 2%;"></td>
                  <td style="padding: 15px; text-align: center; background-color: #f9fafb; border-radius: 8px; width: 33%;">
                    <div style="font-size: 28px; font-weight: bold; color: #10b981; margin-bottom: 5px;">${digest.summary.tasksCompleted}</div>
                    <div style="font-size: 12px; color: #6b7280;">Tarefas Concluídas</div>
                  </td>
                  <td style="width: 2%;"></td>
                  <td style="padding: 15px; text-align: center; background-color: #f9fafb; border-radius: 8px; width: 33%;">
                    <div style="font-size: 28px; font-weight: bold; color: #8b5cf6; margin-bottom: 5px;">${digest.summary.messagesReceived}</div>
                    <div style="font-size: 12px; color: #6b7280;">Mensagens</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Estatísticas adicionais -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; text-align: center; background-color: #fef3c7; border-radius: 6px; width: 50%;">
                    <div style="font-size: 20px; font-weight: bold; color: #d97706; margin-bottom: 3px;">${digest.summary.shiftsScheduled}</div>
                    <div style="font-size: 11px; color: #92400e;">Turnos Agendados</div>
                  </td>
                  <td style="width: 2%;"></td>
                  <td style="padding: 10px; text-align: center; background-color: #dbeafe; border-radius: 6px; width: 50%;">
                    <div style="font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 3px;">${digest.summary.shiftSwapRequests + digest.summary.timeOffRequests}</div>
                    <div style="font-size: 11px; color: #1e3a8a;">Solicitações</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Mensagens não lidas -->
          ${digest.summary.messagesUnread > 0 ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                  ⚠️ Você tem ${digest.summary.messagesUnread} mensagem${digest.summary.messagesUnread > 1 ? 's' : ''} não lida${digest.summary.messagesUnread > 1 ? 's' : ''}
                </p>
                <p style="margin: 10px 0 0 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://organizen-q6vyoa.abacusai.app'}/messages" 
                     style="display: inline-block; padding: 8px 16px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">
                    Ver Mensagens
                  </a>
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Tarefas recentes -->
          ${digest.tasks.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                📋 Tarefas Recentes
              </h2>
              ${digest.tasks.slice(0, 5).map((task: any) => `
                <div style="padding: 12px; margin-bottom: 8px; background-color: #f9fafb; border-radius: 6px; border-left: 3px solid ${task.status === 'COMPLETED' ? '#10b981' : task.priority === 'HIGH' ? '#ef4444' : '#6b7280'};">
                  <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px;">${task.title}</div>
                  <div style="font-size: 12px; color: #6b7280;">
                    Status: <span style="font-weight: 600;">${task.status === 'COMPLETED' ? '✅ Concluída' : task.status === 'IN_PROGRESS' ? '🔄 Em Progresso' : '⏳ Pendente'}</span>
                    ${task.priority ? ` • Prioridade: ${task.priority === 'HIGH' ? '🔴 Alta' : task.priority === 'MEDIUM' ? '🟡 Média' : '🟢 Baixa'}` : ''}
                  </div>
                </div>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://organizen-q6vyoa.abacusai.app'}/dashboard" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Aceder ao Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                ${branding?.emailFooter || 'Este é um resumo automático do OrganiZen.'}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://organizen-q6vyoa.abacusai.app'}/settings/notifications" 
                   style="color: #9ca3af; text-decoration: underline;">
                  Gerenciar Preferências de Resumos
                </a>
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Enviar email via Resend
    const result = await resend.emails.send({
      from: 'noreply@organizen.app',
      to: userEmail,
      subject,
      html
    });

    console.log(`✅ Email de resumo ${digest.period} enviado para ${userEmail}:`, result);

    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Erro ao enviar email de resumo:', error);
    throw error; // Re-throw para ser capturado no cron job
  }
}
