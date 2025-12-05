

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

interface PushNotificationManagerProps {
  showButton?: boolean;
}

export function PushNotificationManager({ showButton = true }: PushNotificationManagerProps) {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [session]);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !session?.user?.id) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!session?.user?.id) {
      toast.error('Você precisa estar logado para ativar notificações');
      return;
    }

    setLoading(true);

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast.error('Permissão de notificações negada');
        setLoading(false);
        return;
      }

      // Registrar service worker se ainda não estiver
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Buscar VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      
      if (!vapidPublicKey) {
        toast.error('Configuração de push notifications incompleta');
        setLoading(false);
        return;
      }

      // Subscrever ao push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Enviar subscription ao servidor
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth'))
          },
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar subscription');
      }

      setIsSubscribed(true);
      toast.success('Notificações push ativadas com sucesso!');
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erro ao ativar notificações push');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remover do servidor
        await fetch('/api/push-subscription', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });

        // Cancelar subscription
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.success('Notificações push desativadas');
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Erro ao desativar notificações push');
    } finally {
      setLoading(false);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  if (!showButton) {
    return null;
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <div>
      {!isSubscribed ? (
        <Button
          onClick={subscribeToPush}
          disabled={loading || permission === 'denied'}
          variant="default"
          size="sm"
        >
          <Bell className="h-4 w-4 mr-2" />
          {loading ? 'Ativando...' : 'Ativar Push Notifications'}
        </Button>
      ) : (
        <Button
          onClick={unsubscribeFromPush}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <BellOff className="h-4 w-4 mr-2" />
          {loading ? 'Desativando...' : 'Desativar Push Notifications'}
        </Button>
      )}
      
      {permission === 'denied' && (
        <p className="text-xs text-muted-foreground mt-2">
          As notificações foram bloqueadas. Por favor, habilite-as nas configurações do navegador.
        </p>
      )}
    </div>
  );
}
