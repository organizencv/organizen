
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { getTranslation, Language } from '@/lib/i18n';
import { User, Clock, X, Mail, MailOpen } from 'lucide-react';
import { format } from 'date-fns';
import { AttachmentManager } from './attachment-manager';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloud_storage_path: string;
}

interface Message {
  id: string;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  attachments?: Attachment[];
}

interface MessageDetailsModalProps {
  message: Message;
  onClose: () => void;
  language: Language;
  onMessageUpdated?: () => void;
}

export function MessageDetailsModal({ message, onClose, language, onMessageUpdated }: MessageDetailsModalProps) {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAsUnread = async () => {
    setIsMarking(true);
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as unread');
      }

      toast.success(getTranslation('markAsUnread', language));
      onMessageUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error marking message as unread:', error);
      toast.error(language === 'pt' ? 'Erro ao marcar mensagem como não lida' : 'Error marking message as unread');
    } finally {
      setIsMarking(false);
    }
  };

  const getRoleTranslation = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return getTranslation('admin', language);
      case 'MANAGER':
        return getTranslation('manager', language);
      case 'SUPERVISOR':
        return getTranslation('supervisor', language);
      case 'STAFF':
        return getTranslation('staff', language);
      default:
        return role;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{message?.subject}</DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  {message?.sender?.name || message?.sender?.email}
                  <Badge variant="outline" className="text-xs">
                    {getRoleTranslation(message?.sender?.role)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(message?.createdAt), 'dd/MM/yyyy HH:mm')}
                </div>
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border shadow-sm">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: message?.content || '' }}
            />
          </div>

          {message?.attachments && message.attachments.length > 0 && (
            <div>
              <AttachmentManager
                attachments={message.attachments}
                onAttachmentsChange={() => {}}
                language={language}
                readonly={true}
                messageId={message.id}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 pt-4">
          <div>
            {message.read && (
              <Button 
                variant="ghost" 
                onClick={handleMarkAsUnread}
                disabled={isMarking}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                {getTranslation('markAsUnread', language)}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {language === 'pt' ? 'Fechar' : 'Close'}
            </Button>
            <Button onClick={() => {
              // TODO: Implementar responder - abrir modal de nova mensagem com replyTo
              // Por enquanto, redirecionar para página de mensagens com destinatário pré-preenchido
              const sender = (message as any).sender || (message as any).receiver;
              if (sender?.id) {
                window.location.href = `/messages?reply=${message.id}&to=${sender.id}`;
              }
            }}>
              {language === 'pt' ? 'Responder' : 'Reply'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
