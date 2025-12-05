

import webpush from 'web-push';
import { prisma } from './db';
import { shouldSendPush } from './notification-service';

// Configurar VAPID keys
const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: 'mailto:admin@organizen.com'
};

webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

/**
 * Interface para dados de push notification
 */
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    relatedId?: string;
  };
}

/**
 * Envia push notification para um usuário específico
 */
export async function sendPushToUser(
  userId: string,
  notification: PushNotificationData
): Promise<{ sent: number; failed: number }> {
  try {
    // Buscar todas as subscriptions ativas do usuário
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/icon-192x192.png',
      tag: notification.tag || 'organizen-notification',
      data: notification.data || {}
    });

    let sent = 0;
    let failed = 0;

    // Enviar para todas as subscriptions do usuário
    const promises = subscriptions.map(async (sub: any) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (error: any) {
        console.error(`Failed to send push to ${sub.endpoint}:`, error.message);
        failed++;

        // Se a subscription expirou ou está inválida, remover do banco
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id }
          }).catch((err: any) => console.error('Error deleting invalid subscription:', err));
        }
      }
    });

    await Promise.all(promises);

    console.log(`Push notifications sent: ${sent} succeeded, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Envia push notification para múltiplos usuários
 */
export async function sendPushToUsers(
  userIds: string[],
  notification: PushNotificationData
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.all(
    userIds.map(userId => sendPushToUser(userId, notification))
  );

  return results.reduce(
    (acc, result) => ({
      sent: acc.sent + result.sent,
      failed: acc.failed + result.failed
    }),
    { sent: 0, failed: 0 }
  );
}

/**
 * Envia push notification para um usuário se ele tiver habilitado
 */
export async function sendPushIfEnabled(
  userId: string,
  eventType: 'task_assigned' | 'task_comment' | 'mention' | 'message' | 'shift_swap' | 'time_off',
  notification: PushNotificationData
): Promise<boolean> {
  // Verificar se o usuário quer receber push para este tipo de evento
  const shouldSend = await shouldSendPush(userId, eventType);
  
  if (!shouldSend) {
    console.log(`User ${userId} has disabled push for ${eventType}`);
    return false;
  }

  const result = await sendPushToUser(userId, notification);
  return result.sent > 0;
}

/**
 * Testa envio de push notification (para botão de teste nas configurações)
 */
export async function sendTestPush(userId: string): Promise<boolean> {
  const notification: PushNotificationData = {
    title: '🔔 Notificação de Teste',
    body: 'Se você está vendo isso, as notificações push estão funcionando!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      type: 'test',
      url: '/settings/notifications'
    }
  };

  const result = await sendPushToUser(userId, notification);
  return result.sent > 0;
}
