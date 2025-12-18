
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

/**
 * API de Cron Job para Notificações de Aniversário
 * 
 * Verifica diariamente os aniversariantes e envia notificações
 * conforme as configurações de cada empresa.
 * 
 * Executado automaticamente às 09:00 (configurável)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🎂 [Birthday Cron] Iniciando verificação de aniversariantes...');

    // Validar CRON_SECRET para segurança
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ [Birthday Cron] Unauthorized: Invalid CRON_SECRET');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Data de hoje
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate(); // 1-31

    console.log(`📅 [Birthday Cron] Verificando aniversariantes para: ${format(today, 'dd/MM/yyyy', { locale: ptBR })}`);

    // Buscar todos os usuários que fazem aniversário hoje
    const birthdayUsers = await prisma.user.findMany({
      where: {
        birthDate: {
          not: null
        }
      }
    });

    // Filtrar usuários que fazem aniversário hoje
    const todayBirthdays = birthdayUsers.filter((user: any) => {
      if (!user.birthDate) return false;
      const birthDate = new Date(user.birthDate);
      return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay;
    });

    console.log(`🎉 [Birthday Cron] Encontrados ${todayBirthdays.length} aniversariantes hoje`);

    if (todayBirthdays.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum aniversariante hoje',
        count: 0
      });
    }

    let notificationsSent = 0;
    let errors = 0;

    // Processar cada aniversariante
    for (const user of todayBirthdays) {
      try {
        console.log(`🎂 [Birthday Cron] Processando: ${user.name} (${user.email})`);

        // Buscar configurações de aniversário da empresa
        const settings = await prisma.birthdaySettings.findUnique({
          where: { companyId: user.companyId }
        });

        // Se não houver configurações ou estiver desabilitado, pular
        if (!settings || !settings.enabled) {
          console.log(`⏭️  [Birthday Cron] Configurações desabilitadas para empresa ${user.companyId}`);
          continue;
        }

        // Calcular idade
        const age = today.getFullYear() - new Date(user.birthDate!).getFullYear();

        // Buscar nome da empresa
        const company = await prisma.company.findUnique({
          where: { id: user.companyId },
          select: { name: true }
        });

        // Buscar equipe do usuário (se houver)
        const primaryTeam = user.teamId ? await prisma.team.findUnique({
          where: { id: user.teamId },
          include: { department: true }
        }) : null;

        // Preparar mensagem personalizada
        const defaultMessage = `🎉 Feliz Aniversário, {{name}}! 🎂\n\nHoje é um dia especial! Toda a equipe do {{companyName}} deseja a você muita saúde, alegria e sucesso!\n\n🎈 Parabéns pelos seus ${age} anos! 🎈`;
        
        const messageTemplate = settings.messageTemplate || defaultMessage;
        const personalizedMessage = messageTemplate
          .replace(/{{name}}/g, user.name || '')
          .replace(/{{companyName}}/g, company?.name || 'Empresa')
          .replace(/{{age}}/g, age.toString())
          .replace(/{{teamName}}/g, primaryTeam?.name || 'equipe');

        // Lista de destinatários
        const recipients: string[] = [];

        // 1. Notificar a pessoa do aniversário
        if (settings.notifyBirthdayPerson) {
          recipients.push(user.id);
        }

        // 2. Notificar gestores (ADMIN, MANAGER, SUPERVISOR)
        if (settings.notifyManagers) {
          const managers = await prisma.user.findMany({
            where: {
              companyId: user.companyId,
              role: {
                in: ['ADMIN', 'MANAGER', 'SUPERVISOR']
              },
              id: { not: user.id }
            },
            select: { id: true }
          });
          recipients.push(...managers.map((m: { id: string }) => m.id));
        }

        // 3. Notificar membros da equipe
        if (settings.notifyTeamMembers && primaryTeam) {
          const teamMembers = await prisma.user.findMany({
            where: {
              teamId: primaryTeam.id,
              id: { not: user.id }
            },
            select: { id: true }
          });
          recipients.push(...teamMembers.map((m: { id: string }) => m.id));
        }

        // Remover duplicatas
        const uniqueRecipients = [...new Set(recipients)];

        console.log(`📨 [Birthday Cron] Enviando ${uniqueRecipients.length} notificações para ${user.name}`);

        // Criar notificações
        for (const recipientId of uniqueRecipients) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              title: `🎉 Aniversário de ${user.name || 'Colaborador'}`,
              message: personalizedMessage,
              type: 'BIRTHDAY',
              read: false
            }
          });
        }

        // Se visibilidade for PUBLIC, criar mensagem no chat global
        if (settings.visibility === 'PUBLIC') {
          // Buscar ou criar conversa global da empresa
          const globalConversation = await prisma.chatGroup.findFirst({
            where: {
              companyId: user.companyId,
              name: 'Geral',
              isActive: true
            }
          });

          if (globalConversation) {
            await prisma.chatMessage.create({
              data: {
                groupId: globalConversation.id,
                senderId: user.id,
                content: `🎂 ${personalizedMessage}`,
                read: false,
                companyId: user.companyId
              }
            });
            console.log(`💬 [Birthday Cron] Mensagem no chat global criada para ${user.name || 'Colaborador'}`);
          }
        }

        notificationsSent += uniqueRecipients.length;
        console.log(`✅ [Birthday Cron] Notificações enviadas com sucesso para ${user.name}`);

      } catch (error) {
        console.error(`❌ [Birthday Cron] Erro ao processar ${user.name}:`, error);
        errors++;
      }
    }

    const summary = {
      success: true,
      date: format(today, 'dd/MM/yyyy', { locale: ptBR }),
      birthdaysFound: todayBirthdays.length,
      notificationsSent,
      errors,
      details: await Promise.all(todayBirthdays.map(async (u: any) => {
        const team = u.teamId ? await prisma.team.findUnique({
          where: { id: u.teamId },
          include: { department: true }
        }) : null;
        return {
          name: u.name || 'Sem nome',
          email: u.email,
          team: team?.name || 'Sem equipe',
          department: team?.department?.name || 'Sem departamento'
        };
      }))
    };

    console.log('✅ [Birthday Cron] Verificação concluída:', summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ [Birthday Cron] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro ao processar aniversários', details: String(error) },
      { status: 500 }
    );
  }
}
