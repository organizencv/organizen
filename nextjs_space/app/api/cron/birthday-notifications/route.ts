
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendNotification } from '@/lib/notification-service';

export const dynamic = "force-dynamic";

// Função para verificar se hoje é aniversário (ignora ano)
function isBirthdayToday(birthDate: Date | null): boolean {
  if (!birthDate) return false;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  return (
    today.getMonth() === birth.getMonth() &&
    today.getDate() === birth.getDate()
  );
}

// Função para verificar se o usuário pode ver o aniversário
function canViewBirthday(
  viewer: { role: string; departmentId: string | null },
  birthdayPerson: { departmentId: string | null },
  visibility: string
): boolean {
  // Se for MANAGERS_ONLY, apenas gestores podem ver
  if (visibility === 'MANAGERS_ONLY') {
    return ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(viewer.role);
  }
  
  // Se for SAME_DEPARTMENT, apenas mesmo departamento
  if (visibility === 'SAME_DEPARTMENT') {
    return viewer.departmentId === birthdayPerson.departmentId;
  }
  
  // ALL - todos podem ver
  return true;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🎂 Birthday notifications cron job started');

    // Buscar todas as empresas
    const companies = await prisma.company.findMany({
      include: {
        birthdaySettings: true,
      },
    });

    let totalNotifications = 0;

    for (const company of companies) {
      try {
        // Verificar se o sistema está ativo para esta empresa
        const settings = company.birthdaySettings;
        if (!settings || !settings.enabled) {
          console.log(`⏭️ Birthday system disabled for company: ${company.name}`);
          continue;
        }

        // Buscar todos os usuários da empresa
        const users = await prisma.user.findMany({
          where: { 
            companyId: company.id,
            birthDate: { not: null },
          },
          include: {
            department: true,
            team: true,
          },
        });

        // Filtrar aniversariantes do dia
        const birthdayUsers = users.filter(user => isBirthdayToday(user.birthDate));

        if (birthdayUsers.length === 0) {
          console.log(`📅 No birthdays today for company: ${company.name}`);
          continue;
        }

        console.log(`🎉 Found ${birthdayUsers.length} birthday(s) for company: ${company.name}`);

        // Para cada aniversariante
        for (const birthdayUser of birthdayUsers) {
          // 1. Notificar o próprio aniversariante
          if (settings.notifyBirthdayPerson) {
            const message = settings.customMessage || 
              `🎂 Feliz Aniversário! Toda a equipa do ${company.name} deseja-lhe um dia maravilhoso! 🎉`;
            
            await sendNotification(
              birthdayUser.id,
              'Feliz Aniversário!',
              message,
              'BIRTHDAY',
              birthdayUser.id
            );
            totalNotifications++;
            console.log(`✉️ Birthday notification sent to: ${birthdayUser.name}`);
          }

          // 2. Notificar membros da equipa/departamento
          if (settings.notifyTeamMembers) {
            const teamMembers = users.filter(user => 
              user.id !== birthdayUser.id && // Não notificar o próprio
              canViewBirthday(
                { role: user.role, departmentId: user.departmentId },
                { departmentId: birthdayUser.departmentId },
                settings.visibility
              )
            );

            for (const member of teamMembers) {
              await sendNotification(
                member.id,
                `🎂 Aniversário de ${birthdayUser.name}`,
                `Hoje é aniversário de ${birthdayUser.name}! Não se esqueça de dar os parabéns! 🎉`,
                'SYSTEM',
                birthdayUser.id
              );
              totalNotifications++;
            }
            console.log(`✉️ ${teamMembers.length} team notifications sent for: ${birthdayUser.name}`);
          }

          // 3. Notificar gestores (se configurado e ainda não notificados)
          if (settings.notifyManagers) {
            const managers = users.filter(user =>
              user.id !== birthdayUser.id &&
              ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(user.role) &&
              // Apenas se não foram notificados como membros da equipa
              (
                !settings.notifyTeamMembers ||
                !canViewBirthday(
                  { role: user.role, departmentId: user.departmentId },
                  { departmentId: birthdayUser.departmentId },
                  settings.visibility
                )
              )
            );

            for (const manager of managers) {
              await sendNotification(
                manager.id,
                `🎂 Aniversário de ${birthdayUser.name}`,
                `Hoje é aniversário de ${birthdayUser.name}${birthdayUser.department ? ` (${birthdayUser.department.name})` : ''}. Considere enviar uma mensagem! 🎉`,
                'SYSTEM',
                birthdayUser.id
              );
              totalNotifications++;
            }
            console.log(`✉️ ${managers.length} manager notifications sent for: ${birthdayUser.name}`);
          }
        }
      } catch (companyError) {
        console.error(`❌ Error processing company ${company.name}:`, companyError);
        // Continuar com as outras empresas mesmo se houver erro
      }
    }

    console.log(`✅ Birthday notifications cron job completed. Total notifications: ${totalNotifications}`);

    return NextResponse.json({ 
      success: true, 
      totalNotifications,
      message: `Processed birthday notifications for ${companies.length} companies`
    });

  } catch (error) {
    console.error('❌ Birthday notifications cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
