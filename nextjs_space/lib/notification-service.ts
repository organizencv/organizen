
import { prisma } from './db';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

/**
 * Verifica se o usuário deseja receber notificação de email para um evento específico
 */
export async function shouldSendEmail(userId: string, eventType: EmailEventType): Promise<boolean> {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  if (!settings) return true; // Se não tem preferências, enviar por padrão

  const eventMap: Record<EmailEventType, keyof typeof settings> = {
    task_assigned: 'emailOnTaskAssigned',
    task_completed: 'emailOnTaskCompleted',
    task_comment: 'emailOnTaskComment',
    mention: 'emailOnMention',
    deadline: 'emailOnDeadline',
    shift_assigned: 'emailOnShiftAssigned',
    shift_swap: 'emailOnShiftSwap',
    time_off: 'emailOnTimeOff',
    message: 'emailOnMessage',
  };

  const field = eventMap[eventType];
  return settings[field] as boolean;
}

/**
 * Verifica se o usuário deseja receber notificação push para um evento específico
 */
export async function shouldSendPush(userId: string, eventType: PushEventType): Promise<boolean> {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  if (!settings) return true; // Se não tem preferências, enviar por padrão
  if (!settings.pushEnabled) return false; // Push desabilitado globalmente

  const eventMap: Record<PushEventType, keyof typeof settings> = {
    task_assigned: 'pushOnTaskAssigned',
    task_comment: 'pushOnTaskComment',
    mention: 'pushOnMention',
    message: 'pushOnMessage',
    shift_swap: 'pushOnShiftSwap',
    time_off: 'pushOnTimeOff',
  };

  const field = eventMap[eventType];
  return settings[field] as boolean;
}

/**
 * Busca usuários que devem receber resumo diário/semanal/mensal
 */
export async function getUsersForDigest(
  period: 'daily' | 'weekly' | 'monthly',
  currentTime: string, // HH:mm
  currentDayOfWeek: number, // 0-6
  currentDayOfMonth: number // 1-31
): Promise<string[]> {
  const where: any = {
    digestTime: currentTime,
  };

  if (period === 'daily') {
    where.dailyDigest = true;
  } else if (period === 'weekly') {
    where.weeklyDigest = true;
    where.digestDayOfWeek = currentDayOfWeek;
  } else if (period === 'monthly') {
    where.monthlyDigest = true;
    // Limitar dia 29-31 para 28 (mês mais curto)
    where.digestDayOfMonth = Math.min(currentDayOfMonth, 28);
  }

  const settings = await prisma.notificationSettings.findMany({
    where,
    select: { userId: true },
  });

  return settings.map((s: any) => s.userId);
}

/**
 * Gera resumo de atividades para um usuário
 */
export async function generateUserDigest(
  userId: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<UserDigest> {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period === 'daily') {
    startDate = startOfDay(subDays(now, 1));
    endDate = endOfDay(subDays(now, 1));
  } else if (period === 'weekly') {
    startDate = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira
    endDate = endOfWeek(now, { weekStartsOn: 1 });
  } else {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  }

  // Buscar tarefas do período
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Buscar mensagens do período
  const messages = await prisma.message.findMany({
    where: {
      receiverId: userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      subject: true,
      read: true,
      sender: {
        select: { name: true, email: true },
      },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Buscar turnos do período
  const shifts = await prisma.shift.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
    },
    orderBy: { startTime: 'asc' },
  });

  // Buscar pedidos de troca de turno
  const shiftSwapRequests = await prisma.shiftSwapRequest.findMany({
    where: {
      OR: [
        { requesterId: userId },
        { targetUserId: userId },
      ],
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      status: true,
      reason: true,
      createdAt: true,
      requester: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Buscar pedidos de folga
  const timeOffRequests = await prisma.timeOffRequest.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    period,
    startDate,
    endDate,
    summary: {
      tasksCreated: tasks.length,
      tasksCompleted: tasks.filter((t: any) => t.status === 'COMPLETED').length,
      messagesReceived: messages.length,
      messagesUnread: messages.filter((m: any) => !m.read).length,
      shiftsScheduled: shifts.length,
      shiftSwapRequests: shiftSwapRequests.length,
      timeOffRequests: timeOffRequests.length,
    },
    tasks: tasks.slice(0, 10), // Limitar a 10 mais recentes
    messages: messages.slice(0, 10),
    shifts: shifts.slice(0, 10),
    shiftSwapRequests: shiftSwapRequests.slice(0, 5),
    timeOffRequests: timeOffRequests.slice(0, 5),
  };
}

// Tipos auxiliares
export type EmailEventType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_comment'
  | 'mention'
  | 'deadline'
  | 'shift_assigned'
  | 'shift_swap'
  | 'time_off'
  | 'message';

export type PushEventType =
  | 'task_assigned'
  | 'task_comment'
  | 'mention'
  | 'message'
  | 'shift_swap'
  | 'time_off';

export interface UserDigest {
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
