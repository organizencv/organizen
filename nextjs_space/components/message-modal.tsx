
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { getTranslation, Language } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AttachmentManager } from './attachment-manager';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloud_storage_path?: string;
}

interface MessageModalProps {
  users: User[];
  onClose: () => void;
  onSaved: (message: any) => void;
  language: Language;
}

export function MessageModal({ users, onClose, onSaved, language }: MessageModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    receiverId: users?.[0]?.id || 'no-receiver',
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const attachmentIds = attachments.map(a => a.id);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attachmentIds
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSaved(data);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTranslation('newMessage', language)}</DialogTitle>
          <DialogDescription>
            {language === 'pt' ? 'Envie uma mensagem para outro utilizador' : 'Send a message to another user'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="receiver">{getTranslation('sendTo', language)}</Label>
            <Select value={formData.receiverId || (users?.[0]?.id || 'no-receiver')} onValueChange={(value) => handleChange('receiverId', value)} required>
              <SelectTrigger>
                <SelectValue placeholder={language === 'pt' ? 'Selecionar destinatário' : 'Select recipient'} />
              </SelectTrigger>
              <SelectContent>
                {users?.filter(user => user?.id).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user?.name || user?.email} ({getRoleTranslation(user?.role)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">{getTranslation('subject', language)}</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              required
              placeholder={language === 'pt' ? 'Assunto da mensagem' : 'Message subject'}
            />
          </div>

          <div>
            <Label htmlFor="content">{getTranslation('content', language)}</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              required
              placeholder={language === 'pt' ? 'Escreva aqui a sua mensagem...' : 'Write your message here...'}
              rows={5}
            />
          </div>

          <div>
            <Label>{getTranslation('attachments', language)}</Label>
            <AttachmentManager
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              language={language}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {getTranslation('cancel', language)}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading 
                ? getTranslation('loading', language)
                : (language === 'pt' ? 'Enviar' : 'Send')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
