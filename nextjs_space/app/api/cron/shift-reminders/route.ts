
/**
 * CRON Job: Lembretes de Turnos
 * 
 * Este endpoint deve ser chamado periodicamente (a cada hora ou conforme necessário)
 * para verificar turnos que começam nas próximas X horas e enviar lembretes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifyShiftReminder } from '@/lib/notification-triggers';
import { addHours, isBefore, isAfter } from 'date-fns';

export const dynamic = "force-dynamic";

// Configurações de lembretes (pode ser movido para configurações da empresa)
const REMINDER_HOURS_BEFORE = [24, 4, 1]; // Lembretes 24h, 4h e 1h antes

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação via header de autorização (para segurança do cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const stats = {
      totalShifts: 0,
      remindersSent: 0,
      errors: 0
    };

    // Para cada período de lembrete
    for (const hoursBefore of REMINDER_HOURS_BEFORE) {
      const targetTime = addHours(now, hoursBefore);
      const windowStart = addHours(targetTime, -0.5); // Janela de 30 min antes
      const windowEnd = addHours(targetTime, 0.5);     // Janela de 30 min depois

      // Buscar turnos que começam nesta janela de tempo
      const shifts = await prisma.shift.findMany({
        where: {
          startTime: {
            gte: windowStart,
            lte: windowEnd
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Filtrar apenas turnos que ainda não receberam este lembrete
      const shiftsToRemind = [];
      for (const shift of shifts) {
        const existingReminder = await prisma.shiftReminder.findUnique({
          where: {
            shiftId_reminderHours: {
              shiftId: shift.id,
              reminderHours: hoursBefore
            }
          }
        });

        if (!existingReminder) {
          shiftsToRemind.push(shift);
        }
      }

      stats.totalShifts += shiftsToRemind.length;

      // Enviar lembrete para cada turno
      for (const shift of shiftsToRemind) {
        try {
          await notifyShiftReminder({
            userId: shift.userId,
            shiftId: shift.id,
            shiftTitle: shift.title,
            shiftStartTime: shift.startTime,
            hoursBeforeStart: hoursBefore
          });

          // Registrar que o lembrete foi enviado
          await prisma.shiftReminder.create({
            data: {
              shiftId: shift.id,
              reminderHours: hoursBefore,
              sentAt: now,
              companyId: shift.companyId
            }
          });

          stats.remindersSent++;
        } catch (error) {
          console.error(`Error sending reminder for shift ${shift.id}:`, error);
          stats.errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats
    });

  } catch (error) {
    console.error('Cron shift-reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
