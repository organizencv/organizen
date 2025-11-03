
'use client';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { getTranslation, Language } from '@/lib/i18n';
import { User, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { AttachmentManager } from './attachment-manager';

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
}

export function MessageDetailsModal({ message, onClose, language }: MessageDetailsModalProps) {
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
          <div className="bg-accent rounded-lg p-4">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {message?.content}
            </p>
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

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            {language === 'pt' ? 'Fechar' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
