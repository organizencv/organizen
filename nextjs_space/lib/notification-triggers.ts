
/**
 * Sistema de Triggers para Notificações Push
 * Integra eventos do sistema com o serviço de push notifications
 */

import { prisma } from './db';
import { sendPushIfEnabled, PushNotificationData } from './push-service';

/**
 * 📨 MENSAGENS RECEBIDAS
 */
export async function notifyMessageReceived(params: {
  receiverId: string;
  senderId: string;
  senderName: string;
  subject: string;
  messageId: string;
}) {
  const { receiverId, senderName, subject, messageId } = params;

  const notification: PushNotificationData = {
    title: `💬 Nova Mensagem de ${senderName}`,
    body: subject,
    icon: '/icon-192x192.png',
    tag: `message-${messageId}`,
    data: {
      type: 'message',
      relatedId: messageId,
      url: '/messages'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId: receiverId,
      title: `Nova Mensagem de ${senderName}`,
      message: subject,
      type: 'MESSAGE',
      relatedId: messageId
    }
  });

  // Enviar push se habilitado
  await sendPushIfEnabled(receiverId, 'message', notification);
}

/**
 * 📋 TAREFA ATRIBUÍDA
 */
export async function notifyTaskAssigned(params: {
  userId: string;
  assignedBy: string;
  assignedByName: string;
  taskId: string;
  taskTitle: string;
  priority?: string;
  dueDate?: Date;
}) {
  const { userId, assignedByName, taskTitle, taskId, priority, dueDate } = params;

  let body = `Tarefa atribuída por ${assignedByName}`;
  if (priority) {
    body += ` | Prioridade: ${priority}`;
  }
  if (dueDate) {
    body += ` | Prazo: ${dueDate.toLocaleDateString('pt-PT')}`;
  }

  const notification: PushNotificationData = {
    title: `✅ ${taskTitle}`,
    body,
    icon: '/icon-192x192.png',
    tag: `task-${taskId}`,
    data: {
      type: 'task_assigned',
      relatedId: taskId,
      url: '/tasks'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId,
      title: `Tarefa Atribuída: ${taskTitle}`,
      message: body,
      type: 'TASK_ASSIGNED',
      relatedId: taskId
    }
  });

  // Enviar push se habilitado
  await sendPushIfEnabled(userId, 'task_assigned', notification);
}

/**
 * 💬 COMENTÁRIO EM TAREFA
 */
export async function notifyTaskComment(params: {
  taskOwnerId: string;
  commentAuthorName: string;
  taskId: string;
  taskTitle: string;
  commentText: string;
}) {
  const { taskOwnerId, commentAuthorName, taskTitle, taskId, commentText } = params;

  const notification: PushNotificationData = {
    title: `💬 ${commentAuthorName} comentou em "${taskTitle}"`,
    body: commentText.substring(0, 100) + (commentText.length > 100 ? '...' : ''),
    icon: '/icon-192x192.png',
    tag: `task-comment-${taskId}`,
    data: {
      type: 'task_comment',
      relatedId: taskId,
      url: '/tasks'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId: taskOwnerId,
      title: `Comentário em "${taskTitle}"`,
      message: `${commentAuthorName}: ${commentText.substring(0, 150)}`,
      type: 'TASK_COMMENT',
      relatedId: taskId
    }
  });

  // Enviar push se habilitado
  await sendPushIfEnabled(taskOwnerId, 'task_comment', notification);
}

/**
 * 🔄 SOLICITAÇÃO DE TROCA DE TURNO
 */
export async function notifyShiftSwapRequest(params: {
  targetUserId: string;
  requesterId: string;
  requesterName: string;
  requestId: string;
  shiftDate: Date;
  reason?: string;
}) {
  const { targetUserId, requesterName, requestId, shiftDate, reason } = params;

  const dateStr = shiftDate.toLocaleDateString('pt-PT', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  const body = reason 
    ? `${dateStr} - ${reason.substring(0, 80)}`
    : `Data: ${dateStr}`;

  const notification: PushNotificationData = {
    title: `🔄 ${requesterName} quer trocar turno`,
    body,
    icon: '/icon-192x192.png',
    tag: `shift-swap-${requestId}`,
    data: {
      type: 'shift_swap',
      relatedId: requestId,
      url: '/requests'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      title: `Pedido de Troca de Turno`,
      message: `${requesterName} solicitou troca de turno para ${dateStr}`,
      type: 'SHIFT_SWAP',
      relatedId: requestId
    }
  });

  // Enviar push se habilitado
  await sendPushIfEnabled(targetUserId, 'shift_swap', notification);
}

/**
 * ✅ RESPOSTA À SOLICITAÇÃO DE TROCA DE TURNO
 */
export async function notifyShiftSwapResponse(params: {
  requesterId: string;
  responderName: string;
  requestId: string;
  status: 'approved' | 'rejected';
  shiftDate: Date;
}) {
  const { requesterId, responderName, requestId, status, shiftDate } = params;

  const dateStr = shiftDate.toLocaleDateString('pt-PT', { 
    day: '2-digit', 
    month: 'long'
  });

  const statusEmoji = status === 'approved' ? '✅' : '❌';
  const statusText = status === 'approved' ? 'aprovou' : 'rejeitou';

  const notification: PushNotificationData = {
    title: `${statusEmoji} ${responderName} ${statusText} a troca`,
    body: `Turno de ${dateStr}`,
    icon: '/icon-192x192.png',
    tag: `shift-swap-response-${requestId}`,
    data: {
      type: 'shift_swap',
      relatedId: requestId,
      url: '/requests'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId: requesterId,
      title: `Troca de Turno ${status === 'approved' ? 'Aprovada' : 'Rejeitada'}`,
      message: `${responderName} ${statusText} sua solicitação de troca para ${dateStr}`,
      type: 'SHIFT_SWAP',
      relatedId: requestId
    }
  });

  // Enviar push se habilitado
  await sendPushIfEnabled(requesterId, 'shift_swap', notification);
}

/**
 * 🏖️ SOLICITAÇÃO DE FOLGA
 */
export async function notifyTimeOffRequest(params: {
  managerId: string;
  requesterId: string;
  requesterName: string;
  requestId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}) {
  const { managerId, requesterName, requestId, type, startDate, endDate, reason } = params;

  const startStr = startDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  const endStr = endDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  const periodStr = startStr === endStr ? startStr : `${startStr} - ${endStr}`;

  const body = reason 
    ? `${periodStr} - ${reason.substring(0, 60)}`
    : `Período: ${periodStr}`;

  const notification: PushNotificationData = {
    title: `🏖️ ${requesterName} solicitou ${type}`,
    body,
    icon: '/icon-192x192.png',
    tag: `time-off-${requestId}`,
    data: {
      type: 'time_off',
      relatedId: requestId,
      url: '/requests'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId: managerId,
      title: `Pedido de ${type}`,
      message: `${requesterName} solicitou ${type} de ${periodStr}`,
      type: 'TIME_OFF',
      relatedId: requestId
    }
  });

  // Enviar push se habilitado
  await sendPushIfEnabled(managerId, 'time_off', notification);
}

/**
 * ✅ RESPOSTA À SOLICITAÇÃO DE FOLGA
 */
export async function notifyTimeOffResponse(params: {
  userId: string;
  approverName: string;
  requestId: string;
  status: 'approved' | 'rejected';
  type: string;
  startDate: Date;
  endDate: Date;
}) {
  const { userId, approverName, requestId, status, type, startDate, endDate } = params;

  const startStr = startDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  const endStr = endDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  const periodStr = startStr === endStr ? startStr : `${startStr} - ${endStr}`;

  const statusEmoji = status === 'approved' ? '✅' : '❌';
  const statusText = status === 'approved' ? 'aprovou' : 'rejeitou';

  const notification: PushNotificationData = {
    title: `${statusEmoji} ${type} ${status === 'approved' ? 'aprovado' : 'rejeitado'}`,
    body: `${approverName} ${statusText} seu pedido de ${periodStr}`,
    icon: '/icon-192x192.png',
    tag: `time-off-response-${requestId}`,
    data: {
      type: 'time_off',
      relatedId: requestId,
      url: '/requests'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId,
      title: `${type} ${status === 'approved' ? 'Aprovado' : 'Rejeitado'}`,
      message: `${approverName} ${statusText} sua solicitação de ${periodStr}`,
      type: 'TIME_OFF',
      relatedId: requestId
    }
  });

  // Enviar push se habilitado
  await sendPushIfEnabled(userId, 'time_off', notification);
}



/**
 * ⏰ LEMBRETE DE TURNO (X horas antes)
 */
export async function notifyShiftReminder(params: {
  userId: string;
  shiftId: string;
  shiftTitle: string;
  shiftStartTime: Date;
  hoursBeforeStart: number;
}) {
  const { userId, shiftTitle, shiftStartTime, shiftId, hoursBeforeStart } = params;

  const timeStr = shiftStartTime.toLocaleTimeString('pt-PT', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const dateStr = shiftStartTime.toLocaleDateString('pt-PT', { 
    day: '2-digit', 
    month: 'long' 
  });

  const notification: PushNotificationData = {
    title: `⏰ Lembrete: ${shiftTitle}`,
    body: `Seu turno começa em ${hoursBeforeStart}h (${timeStr} de ${dateStr})`,
    icon: '/icon-192x192.png',
    tag: `shift-reminder-${shiftId}`,
    data: {
      type: 'shift_reminder',
      relatedId: shiftId,
      url: '/shifts'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId,
      title: `Lembrete de Turno`,
      message: `${shiftTitle} começa em ${hoursBeforeStart}h (${timeStr})`,
      type: 'SHIFT_REMINDER',
      relatedId: shiftId
    }
  });

  // Enviar push (usar tipo 'message' como fallback)
  await sendPushIfEnabled(userId, 'message', notification);
}

/**
 * 📢 MENÇÃO EM COMENTÁRIO/TAREFA
 */
export async function notifyMention(params: {
  mentionedUserId: string;
  mentionedBy: string;
  mentionedByName: string;
  contextType: 'task' | 'comment' | 'message';
  contextId: string;
  contextTitle: string;
  mentionText: string;
}) {
  const { mentionedUserId, mentionedByName, contextType, contextId, contextTitle, mentionText } = params;

  const typeEmoji = contextType === 'task' ? '📋' : contextType === 'comment' ? '💬' : '📨';
  const typeText = contextType === 'task' ? 'tarefa' : contextType === 'comment' ? 'comentário' : 'mensagem';

  const notification: PushNotificationData = {
    title: `${typeEmoji} ${mentionedByName} mencionou você`,
    body: `Em ${typeText}: ${contextTitle.substring(0, 60)}`,
    icon: '/icon-192x192.png',
    tag: `mention-${contextType}-${contextId}`,
    data: {
      type: 'mention',
      relatedId: contextId,
      url: contextType === 'task' ? '/tasks' : contextType === 'comment' ? '/tasks' : '/messages'
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId: mentionedUserId,
      title: `${mentionedByName} mencionou você`,
      message: `Em ${typeText}: ${mentionText.substring(0, 150)}`,
      type: 'MENTION',
      relatedId: contextId
    }
  });

  // Enviar push se habilitado
  await sendPushIfEnabled(mentionedUserId, 'mention', notification);
}

/**
 * 📊 RELATÓRIO PRONTO
 */
export async function notifyReportReady(params: {
  userId: string;
  reportType: string;
  reportPeriod: string;
  reportUrl: string;
}) {
  const { userId, reportType, reportPeriod, reportUrl } = params;

  const notification: PushNotificationData = {
    title: `📊 Relatório ${reportType} pronto`,
    body: `Período: ${reportPeriod}`,
    icon: '/icon-192x192.png',
    tag: `report-${Date.now()}`,
    data: {
      type: 'report',
      url: reportUrl
    }
  };

  // Criar notificação in-app
  await prisma.notification.create({
    data: {
      userId,
      title: `Relatório ${reportType} Disponível`,
      message: `Seu relatório de ${reportPeriod} está pronto para download`,
      type: 'REPORT',
      relatedId: reportUrl
    }
  });

  // Enviar push (usar tipo 'message' como fallback)
  await sendPushIfEnabled(userId, 'message', notification);
}
