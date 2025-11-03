
/**
 * CRON Job: Envio de Resumos (Digests)
 * 
 * Este endpoint deve ser chamado periodicamente (a cada hora)
 * para verificar usuários que devem receber resumos e enviá-los por email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUsersForDigest, generateUserDigest } from '@/lib/notification-service';
import { sendDigestEmail } from '@/lib/email';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação via header de autorização (para segurança do cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:00`;
    const currentDayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
    const currentDayOfMonth = now.getDate(); // 1-31

    console.log(`🕐 [${currentTime}] Verificando resumos para envio...`);

    const stats = {
      daily: { found: 0, sent: 0, errors: 0 },
      weekly: { found: 0, sent: 0, errors: 0 },
      monthly: { found: 0, sent: 0, errors: 0 },
    };

    // Buscar usuários para cada tipo de resumo
    const dailyUsers = await getUsersForDigest('daily', currentTime, currentDayOfWeek, currentDayOfMonth);
    const weeklyUsers = await getUsersForDigest('weekly', currentTime, currentDayOfWeek, currentDayOfMonth);
    const monthlyUsers = await getUsersForDigest('monthly', currentTime, currentDayOfWeek, currentDayOfMonth);

    stats.daily.found = dailyUsers.length;
    stats.weekly.found = weeklyUsers.length;
    stats.monthly.found = monthlyUsers.length;

    console.log(`📊 Resumos a enviar:`);
    console.log(`   Diário: ${dailyUsers.length} usuários`);
    console.log(`   Semanal: ${weeklyUsers.length} usuários`);
    console.log(`   Mensal: ${monthlyUsers.length} usuários`);

    // Processar resumos diários
    for (const userId of dailyUsers) {
      try {
        const digest = await generateUserDigest(userId, 'daily');
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, companyId: true },
        });

        if (user?.email) {
          await sendDigestEmail(
            user.email,
            user.name || 'Utilizador',
            user.companyId,
            digest
          );
          console.log(`✅ Resumo diário enviado para ${user.email}`);
          stats.daily.sent++;
        }
      } catch (error) {
        console.error(`❌ Erro ao enviar resumo diário para ${userId}:`, error);
        stats.daily.errors++;
      }
    }

    // Processar resumos semanais
    for (const userId of weeklyUsers) {
      try {
        const digest = await generateUserDigest(userId, 'weekly');
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, companyId: true },
        });

        if (user?.email) {
          await sendDigestEmail(
            user.email,
            user.name || 'Utilizador',
            user.companyId,
            digest
          );
          console.log(`✅ Resumo semanal enviado para ${user.email}`);
          stats.weekly.sent++;
        }
      } catch (error) {
        console.error(`❌ Erro ao enviar resumo semanal para ${userId}:`, error);
        stats.weekly.errors++;
      }
    }

    // Processar resumos mensais
    for (const userId of monthlyUsers) {
      try {
        const digest = await generateUserDigest(userId, 'monthly');
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, companyId: true },
        });

        if (user?.email) {
          await sendDigestEmail(
            user.email,
            user.name || 'Utilizador',
            user.companyId,
            digest
          );
          console.log(`✅ Resumo mensal enviado para ${user.email}`);
          stats.monthly.sent++;
        }
      } catch (error) {
        console.error(`❌ Erro ao enviar resumo mensal para ${userId}:`, error);
        stats.monthly.errors++;
      }
    }

    const totalSent = stats.daily.sent + stats.weekly.sent + stats.monthly.sent;
    const totalErrors = stats.daily.errors + stats.weekly.errors + stats.monthly.errors;

    console.log(`✅ Processamento de resumos concluído!`);
    console.log(`   Total enviado: ${totalSent}`);
    console.log(`   Total erros: ${totalErrors}`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
      summary: {
        totalSent,
        totalErrors
      }
    });

  } catch (error) {
    console.error('❌ Cron send-digests error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
