'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getTranslation, Language } from '@/lib/i18n';
import { Loader2, X, Users, Clock, FileText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AttachmentManager } from './attachment-manager';
import { RichTextEditor } from './rich-text-editor';

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

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string | null;
}

interface ReplyToMessage {
  id: string;
  subject: string;
  sender: {
    name: string | null;
    email: string;
  };
}

interface MessageModalProps {
  users: User[];
  onClose: () => void;
  onSaved: (message: any) => void;
  language: Language;
  replyTo?: ReplyToMessage | null;
  draftId?: string | null;
  initialData?: {
    subject?: string;
    content?: string;
    recipientsTo?: string[];
    recipientsCC?: string[];
    recipientsBCC?: string[];
    priority?: string;
    scheduledFor?: string;
    attachments?: Attachment[];
  } | null;
}

export function MessageModal({ users, onClose, onSaved, language, replyTo, draftId, initialData }: MessageModalProps) {
  console.log('🔍 MessageModal aberto com initialData:', initialData);
  
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showCCBCC, setShowCCBCC] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [emailSignature, setEmailSignature] = useState<string>('');
  const [formData, setFormData] = useState({
    subject: initialData?.subject || (replyTo ? `Re: ${replyTo.subject}` : ''),
    content: initialData?.content || '',
    recipientsTo: initialData?.recipientsTo || [] as string[],
    recipientsCC: initialData?.recipientsCC || [] as string[],
    recipientsBCC: initialData?.recipientsBCC || [] as string[],
    priority: initialData?.priority || 'NORMAL',
    scheduledFor: initialData?.scheduledFor || '',
  });
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
  const [selectedToUser, setSelectedToUser] = useState<string>('');
  const [selectedCCUser, setSelectedCCUser] = useState<string>('');
  const [selectedBCCUser, setSelectedBCCUser] = useState<string>('');
  const { toast } = useToast();

  // Carregar templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/message-templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    loadTemplates();
  }, []);

  // Pré-preencher destinatário ao responder
  useEffect(() => {
    if (replyTo) {
      // Encontrar o ID do remetente nos users
      const sender = users.find(u => u.email === replyTo.sender.email);
      if (sender && !formData.recipientsTo.includes(sender.id)) {
        console.log('✅ Adicionando destinatário automaticamente:', sender);
        setFormData(prev => ({
          ...prev,
          recipientsTo: [sender.id]
        }));
      }
    }
  }, [replyTo, users]);

  // Mostrar CC/BCC se o rascunho tiver esses campos
  useEffect(() => {
    if (initialData && (initialData.recipientsCC?.length || initialData.recipientsBCC?.length)) {
      console.log('📝 Mostrando CC/BCC para rascunho');
      setShowCCBCC(true);
    }
  }, [initialData]);

  // Buscar assinatura do utilizador
  useEffect(() => {
    const fetchSignature = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.emailSignature) {
            setEmailSignature(data.emailSignature);
          }
        }
      } catch (error) {
        console.error('Error fetching email signature:', error);
      }
    };
    
    fetchSignature();
  }, [session?.user?.id]);

  // Auto-save rascunho a cada 30s
  useEffect(() => {
    if (!formData.subject && !formData.content) return;

    const timer = setTimeout(() => {
      handleSaveDraft(true); // true = silent save
    }, 30000);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleAddRecipient = (type: 'TO' | 'CC' | 'BCC') => {
    const userId = type === 'TO' ? selectedToUser : type === 'CC' ? selectedCCUser : selectedBCCUser;
    
    if (!userId || userId === 'none') return;

    setFormData(prev => {
      const key = type === 'TO' ? 'recipientsTo' : type === 'CC' ? 'recipientsCC' : 'recipientsBCC';
      const current = prev[key];
      
      if (current.includes(userId)) return prev;
      
      return {
        ...prev,
        [key]: [...current, userId]
      };
    });

    // Reset selector
    if (type === 'TO') setSelectedToUser('');
    if (type === 'CC') setSelectedCCUser('');
    if (type === 'BCC') setSelectedBCCUser('');
  };

  const handleRemoveRecipient = (type: 'TO' | 'CC' | 'BCC', userId: string) => {
    setFormData(prev => {
      const key = type === 'TO' ? 'recipientsTo' : type === 'CC' ? 'recipientsCC' : 'recipientsBCC';
      return {
        ...prev,
        [key]: prev[key].filter(id => id !== userId)
      };
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || 'Unknown';
  };

  const handleApplyTemplate = (templateId: string) => {
    console.log('🔍 Template selecionado:', templateId);
    
    if (templateId === 'none') {
      // Limpar template - manter só o replyTo se existir
      setFormData(prev => ({
        ...prev,
        subject: replyTo ? `Re: ${replyTo.subject}` : '',
        content: ''
      }));
      console.log('✅ Template limpo');
      return;
    }

    const template = templates.find(t => t.id === templateId);
    console.log('📄 Template encontrado:', template);
    
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content
      }));
      console.log('✅ Template aplicado:', { subject: template.subject, contentLength: template.content.length });
      toast({
        title: getTranslation('useTemplate', language),
        description: language === 'pt' ? 'Template aplicado com sucesso' : 'Template applied successfully'
      });
    } else {
      console.error('❌ Template não encontrado:', templateId);
    }
  };

  const handleSaveDraft = async (silent = false) => {
    setIsSavingDraft(true);

    try {
      const receiverId = formData.recipientsTo[0] || users[0]?.id;
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          receiverId,
          attachmentIds: attachments.map(a => a.id),
          isDraft: true,
          replyToId: replyTo?.id || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (!silent) {
          toast({
            title: getTranslation('saveDraft', language),
            description: language === 'pt' ? 'Rascunho guardado' : 'Draft saved'
          });
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.recipientsTo.length === 0) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Adicione pelo menos um destinatário' : 'Add at least one recipient',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const receiverId = formData.recipientsTo[0];
      const attachmentIds = attachments.map(a => a.id);
      
      // Adicionar assinatura ao conteúdo se existir
      let finalContent = formData.content;
      if (emailSignature) {
        finalContent = `${formData.content}<br/><br/>${emailSignature}`;
      }
      
      console.log('📎 Enviando mensagem com anexos:', {
        totalAnexos: attachments.length,
        anexos: attachments,
        attachmentIds,
        hasSignature: !!emailSignature
      });
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          content: finalContent,
          receiverId,
          attachmentIds,
          isDraft: false,
          replyToId: replyTo?.id || null
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {replyTo 
              ? `${getTranslation('reply', language)}: ${replyTo.subject}`
              : getTranslation('messages', language)
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reply Info */}
          {replyTo && (
            <div className="p-3 bg-muted border border-border rounded-md text-sm">
              <strong>{getTranslation('inReplyTo', language)}:</strong> {replyTo.sender.name || replyTo.sender.email}
            </div>
          )}

          {/* Templates */}
          {templates.length > 0 && (
            <div>
              <Label>{getTranslation('messageTemplate', language)}</Label>
              <Select onValueChange={handleApplyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder={getTranslation('useTemplate', language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {language === 'pt' ? 'Nenhum template' : 'No template'}
                  </SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.category && `(${template.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority */}
          <div>
            <Label>{getTranslation('messagePriority', language)}</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{getTranslation('priorityLow', language)}</SelectItem>
                <SelectItem value="NORMAL">{getTranslation('priorityNormal', language)}</SelectItem>
                <SelectItem value="HIGH">{getTranslation('priorityHigh', language)}</SelectItem>
                <SelectItem value="URGENT">{getTranslation('priorityUrgent', language)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients TO */}
          <div>
            <Label>{getTranslation('to', language)}</Label>
            <div className="flex gap-2">
              <Select value={selectedToUser} onValueChange={setSelectedToUser}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={getTranslation('addRecipient', language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">---</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => handleAddRecipient('TO')} size="sm">
                {getTranslation('add', language)}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.recipientsTo.map(userId => (
                <Badge key={userId} variant="secondary" className="pr-1">
                  {getUserName(userId)}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveRecipient('TO', userId)} 
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* CC/BCC Toggle */}
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowCCBCC(!showCCBCC)}>
            <Users className="h-4 w-4 mr-2" />
            {showCCBCC ? 'Ocultar CC/BCC' : 'Mostrar CC/BCC'}
          </Button>

          {/* CC Recipients */}
          {showCCBCC && (
            <>
              <div>
                <Label>{getTranslation('cc', language)}</Label>
                <div className="flex gap-2">
                  <Select value={selectedCCUser} onValueChange={setSelectedCCUser}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={getTranslation('addRecipient', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">---</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={() => handleAddRecipient('CC')} size="sm">
                    {getTranslation('add', language)}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.recipientsCC.map(userId => (
                    <Badge key={userId} variant="outline" className="pr-1">
                      {getUserName(userId)}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveRecipient('CC', userId)} 
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* BCC Recipients */}
              <div>
                <Label>{getTranslation('bcc', language)}</Label>
                <div className="flex gap-2">
                  <Select value={selectedBCCUser} onValueChange={setSelectedBCCUser}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={getTranslation('addRecipient', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">---</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={() => handleAddRecipient('BCC')} size="sm">
                    {getTranslation('add', language)}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.recipientsBCC.map(userId => (
                    <Badge key={userId} variant="destructive" className="pr-1">
                      {getUserName(userId)}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveRecipient('BCC', userId)} 
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Subject */}
          <div>
            <Label htmlFor="subject">{getTranslation('subject', language)}</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <Label>{getTranslation('content', language)}</Label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              language={language}
            />
          </div>

          {/* Attachments */}
          <div>
            <Label>{getTranslation('attachments', language)}</Label>
            <AttachmentManager
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              language={language}
            />
          </div>

          {/* Actions */}
          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {getTranslation('cancel', language)}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => handleSaveDraft(false)}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {getTranslation('saveDraft', language)}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {language === 'pt' ? 'Enviar' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
