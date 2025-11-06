
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NotificationType } from '@prisma/client';

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

// GET - Testar sistema de notificações de aniversário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const logs: string[] = [];
    const today = new Date();
    logs.push(`📅 Data de hoje: ${today.toLocaleDateString('pt-PT')}`);

    // 1. Verificar configurações
    logs.push('\n🔧 VERIFICANDO CONFIGURAÇÕES...');
    const settings = await prisma.birthdaySettings.findFirst({
      where: { companyId: session.user.companyId }
    });
    
    if (!settings) {
      logs.push('❌ Nenhuma configuração encontrada');
      return NextResponse.json({ logs, settings: null, users: [] });
    }
    
    logs.push(`✅ Configurações encontradas:`);
    logs.push(`   - Ativo: ${settings.enabled ? 'Sim' : 'Não'}`);
    logs.push(`   - Visibilidade: ${settings.visibility}`);
    logs.push(`   - Notificar aniversariante: ${settings.notifyBirthdayPerson ? 'Sim' : 'Não'}`);
    logs.push(`   - Notificar equipa: ${settings.notifyTeamMembers ? 'Sim' : 'Não'}`);
    logs.push(`   - Notificar gestores: ${settings.notifyManagers ? 'Sim' : 'Não'}`);

    // 2. Buscar todos os usuários da empresa
    logs.push('\n👥 BUSCANDO USUÁRIOS...');
    const allUsers = await prisma.user.findMany({
      where: { 
        companyId: session.user.companyId,
      },
      include: {
        department: true,
      },
    });
    
    logs.push(`✅ Total de usuários: ${allUsers.length}`);
    
    const usersWithBirthdate = allUsers.filter(u => u.birthDate !== null);
    logs.push(`✅ Usuários com data de nascimento: ${usersWithBirthdate.length}`);

    // 3. Verificar aniversariantes de hoje
    logs.push('\n🎂 VERIFICANDO ANIVERSARIANTES DE HOJE...');
    const birthdayUsers = usersWithBirthdate.filter(user => {
      const isBirthday = isBirthdayToday(user.birthDate);
      const birthDate = user.birthDate ? new Date(user.birthDate) : null;
      logs.push(`   - ${user.name}: ${birthDate?.toLocaleDateString('pt-PT')} → ${isBirthday ? '🎉 ANIVERSÁRIO!' : '❌ Não'}`);
      return isBirthday;
    });

    if (birthdayUsers.length === 0) {
      logs.push('❌ Nenhum aniversariante hoje');
      logs.push('\n💡 SUGESTÃO: Para testar, altere a data de nascimento de um usuário para hoje:');
      logs.push(`   ${today.getDate()}/${today.getMonth() + 1}/1990`);
    } else {
      logs.push(`\n✅ ${birthdayUsers.length} aniversariante(s) encontrado(s):`);
      birthdayUsers.forEach(user => {
        logs.push(`   - ${user.name} (${user.email})`);
      });
    }

    // 4. Verificar notificações existentes
    logs.push('\n🔔 VERIFICANDO NOTIFICAÇÕES EXISTENTES...');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const existingNotifications = await prisma.notification.findMany({
      where: {
        type: NotificationType.BIRTHDAY,
        createdAt: {
          gte: todayStart,
        },
      },
    });
    
    if (existingNotifications.length === 0) {
      logs.push('❌ Nenhuma notificação de aniversário criada hoje');
    } else {
      logs.push(`✅ ${existingNotifications.length} notificação(ões) encontrada(s):`);
      existingNotifications.forEach(notif => {
        logs.push(`   - "${notif.title}" (ID: ${notif.id})`);
      });
    }

    // 5. Simular envio de notificações (se houver aniversariantes)
    if (settings.enabled && birthdayUsers.length > 0) {
      logs.push('\n📧 SIMULANDO ENVIO DE NOTIFICAÇÕES...');
      
      for (const birthdayUser of birthdayUsers) {
        let count = 0;
        
        // Notificar aniversariante
        if (settings.notifyBirthdayPerson) {
          logs.push(`   ✉️ Notificação para o aniversariante: ${birthdayUser.name}`);
          count++;
        }
        
        // Notificar membros da equipa
        if (settings.notifyTeamMembers) {
          const teamCount = allUsers.filter(u => u.id !== birthdayUser.id).length;
          logs.push(`   ✉️ Notificações para a equipa: ${teamCount} pessoas`);
          count += teamCount;
        }
        
        logs.push(`   📊 Total de notificações que seriam enviadas: ${count}`);
      }
    }

    return NextResponse.json({
      success: true,
      logs,
      summary: {
        settingsEnabled: settings.enabled,
        totalUsers: allUsers.length,
        usersWithBirthdate: usersWithBirthdate.length,
        birthdayUsersToday: birthdayUsers.length,
        existingNotifications: existingNotifications.length,
      },
      birthdayUsers: birthdayUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        birthDate: u.birthDate,
      })),
      settings,
    });

  } catch (error) {
    console.error('Test birthday notifications error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// POST - Forçar envio de notificações para aniversariantes de hoje
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const logs: string[] = [];
    logs.push('🚀 FORÇANDO ENVIO DE NOTIFICAÇÕES...');

    // Buscar configurações
    const settings = await prisma.birthdaySettings.findFirst({
      where: { companyId: session.user.companyId }
    });
    
    if (!settings || !settings.enabled) {
      logs.push('❌ Sistema desativado ou sem configurações');
      return NextResponse.json({ success: false, logs });
    }

    // Buscar usuários
    const allUsers = await prisma.user.findMany({
      where: { 
        companyId: session.user.companyId,
        birthDate: { not: null },
      },
      include: {
        department: true,
      },
    });

    const birthdayUsers = allUsers.filter(user => isBirthdayToday(user.birthDate));

    if (birthdayUsers.length === 0) {
      logs.push('❌ Nenhum aniversariante hoje para notificar');
      return NextResponse.json({ success: false, logs });
    }

    let totalNotifications = 0;

    for (const birthdayUser of birthdayUsers) {
      logs.push(`\n🎂 Processando: ${birthdayUser.name}`);

      // 1. Notificar o aniversariante
      if (settings.notifyBirthdayPerson) {
        const message = settings.customMessage || 
          `🎂 Feliz Aniversário! Toda a equipa deseja-lhe um dia maravilhoso! 🎉`;
        
        await prisma.notification.create({
          data: {
            userId: birthdayUser.id,
            title: 'Feliz Aniversário!',
            message,
            type: NotificationType.BIRTHDAY,
            relatedId: birthdayUser.id,
          },
        });
        totalNotifications++;
        logs.push(`   ✅ Notificado: ${birthdayUser.name} (próprio)`);
      }

      // 2. Notificar outros membros
      if (settings.notifyTeamMembers) {
        const otherUsers = allUsers.filter(u => u.id !== birthdayUser.id);
        
        for (const user of otherUsers) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: `🎂 Aniversário de ${birthdayUser.name}`,
              message: `Hoje é aniversário de ${birthdayUser.name}! Não se esqueça de dar os parabéns! 🎉`,
              type: NotificationType.BIRTHDAY,
              relatedId: birthdayUser.id,
            },
          });
          totalNotifications++;
        }
        logs.push(`   ✅ Notificados: ${otherUsers.length} membros da equipa`);
      }
    }

    logs.push(`\n✅ CONCLUÍDO! Total de notificações enviadas: ${totalNotifications}`);

    return NextResponse.json({
      success: true,
      totalNotifications,
      logs,
    });

  } catch (error) {
    console.error('Force birthday notifications error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
