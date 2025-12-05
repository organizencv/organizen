
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { getTranslation, Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'MESSAGE' | 'TASK' | 'SHIFT' | 'SYSTEM' | 'CHAT';
  read: boolean;
  relatedId?: string | null;
  createdAt: string;
}

interface NotificationsCenterProps {
  language: Language;
}

export function NotificationsCenter({ language }: NotificationsCenterProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // Função para buscar notificações
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        const unread = data.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);

        // Tocar som se houver novas notificações não lidas
        if (soundEnabled && unread > lastNotificationCount) {
          playNotificationSound();
        }
        setLastNotificationCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [session?.user?.id, soundEnabled, lastNotificationCount]);

  // Polling a cada 10 segundos
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Carregar preferência de som do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationSound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const playNotificationSound = () => {
    try {
      // Gerar som usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('notificationSound', enabled.toString());
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
      });
      if (response.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllRead = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navegar para a página relacionada com contexto específico
    if (notification.relatedId) {
      switch (notification.type) {
        case 'MESSAGE':
          // Buscar informações da mensagem para abrir o chat com o remetente
          try {
            const response = await fetch(`/api/messages/${notification.relatedId}`);
            if (response.ok) {
              const message = await response.json();
              // Redirecionar para /messages com query parameter do usuário remetente
              const otherUserId = message.senderId === session?.user?.id ? message.receiverId : message.senderId;
              router.push(`/messages?userId=${otherUserId}`);
            } else {
              // Se a mensagem não existir mais, apenas ir para a página de mensagens
              router.push('/messages');
            }
          } catch (error) {
            console.error('Error fetching message:', error);
            router.push('/messages');
          }
          break;
        case 'CHAT':
          // Buscar informações da mensagem de chat para abrir a conversa
          try {
            const response = await fetch(`/api/chat/messages/${notification.relatedId}`);
            if (response.ok) {
              const chatMessage = await response.json();
              // Redirecionar para /chat com o ID do outro usuário na conversa
              const otherUserId = chatMessage.senderId === session?.user?.id ? chatMessage.receiverId : chatMessage.senderId;
              router.push(`/chat?userId=${otherUserId}`);
            } else {
              // Se a mensagem não existir mais, apenas ir para a página de chat
              router.push('/chat');
            }
          } catch (error) {
            console.error('Error fetching chat message:', error);
            router.push('/chat');
          }
          break;
        case 'TASK':
          // Redirecionar para tasks com o ID da tarefa para abrir automaticamente
          router.push(`/tasks?taskId=${notification.relatedId}`);
          break;
        case 'SHIFT':
          // Redirecionar para shifts com o ID do turno
          router.push(`/shifts?shiftId=${notification.relatedId}`);
          break;
        default:
          // Para notificações de sistema, apenas marcar como lida
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return '💬';
      case 'CHAT':
        return '💭';
      case 'TASK':
        return '✅';
      case 'SHIFT':
        return '🕐';
      case 'SYSTEM':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return getTranslation('justNow', language);
    if (diffMins < 60) return `${diffMins} ${getTranslation('minutesAgo', language)}`;
    if (diffHours < 24) return `${diffHours} ${getTranslation('hoursAgo', language)}`;
    return `${diffDays} ${getTranslation('daysAgo', language)}`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 md:w-96">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="font-semibold text-sm">
              {getTranslation('notifications', language)}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="h-7 w-7 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <DropdownMenuSeparator />
          
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {getTranslation('noNotifications', language)}
            </div>
          ) : (
            <>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        notification.read 
                          ? "hover:bg-muted/50" 
                          : "bg-primary/10 hover:bg-primary/10"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <DropdownMenuSeparator />
              <div className="flex items-center gap-2 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={loading || unreadCount === 0}
                  className="flex-1 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {getTranslation('markAllAsRead', language)}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllRead}
                  disabled={loading}
                  className="flex-1 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {getTranslation('clearAll', language)}
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTranslation('notifications', language)}</DialogTitle>
            <DialogDescription>
              Configure suas preferências de notificações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">
                  {getTranslation('notificationSound', language)}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {getTranslation('notificationSoundDesc', language)}
                </p>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
