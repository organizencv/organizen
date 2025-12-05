
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MessageModal } from './message-modal';
import { MessageDetailsModal } from './message-details-modal';
import { MessageTemplateModal } from './message-template-modal';
import { MessageTemplatesList } from './message-templates-list';
import { FolderManager } from './folder-manager';
import { getTranslation, Language } from '@/lib/i18n';
import { Plus, Search, MessageSquare, User, Clock, Eye, Send, Inbox, Archive, Trash2, FolderOpen, MoreVertical, Paperclip, FileText, Filter, X, Download, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PageHeader } from './page-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloud_storage_path: string;
}

interface ReceivedMessage {
  id: string;
  subject: string;
  content: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
  folderId?: string | null;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  attachments?: Attachment[];
}

interface SentMessage {
  id: string;
  subject: string;
  content: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
  folderId?: string | null;
  receiver: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  attachments?: Attachment[];
}

interface ArchivedMessage {
  id: string;
  subject: string;
  content: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  folderId?: string | null;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  receiver: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  folder?: {
    id: string;
    name: string;
    color: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  attachments?: Attachment[];
}

interface FolderType {
  id: string;
  name: string;
  color: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface MessagesContentProps {
  receivedMessages: ReceivedMessage[];
  sentMessages: SentMessage[];
  archivedMessages: ArchivedMessage[];
  folders: FolderType[];
  users: User[];
  currentUserId: string;
  openUserId?: string;
}

export function MessagesContent({ 
  receivedMessages: initialReceivedMessages, 
  sentMessages: initialSentMessages, 
  archivedMessages: initialArchivedMessages,
  folders: initialFolders,
  users, 
  currentUserId,
  openUserId
}: MessagesContentProps) {
  // Helper para remover tags HTML e extrair texto simples
  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('pt');
  const [receivedMessages, setReceivedMessages] = useState(initialReceivedMessages);
  const [sentMessages, setSentMessages] = useState(initialSentMessages);
  const [archivedMessages, setArchivedMessages] = useState(initialArchivedMessages);
  const [folders, setFolders] = useState(initialFolders);
  const [filteredReceivedMessages, setFilteredReceivedMessages] = useState(initialReceivedMessages);
  const [filteredSentMessages, setFilteredSentMessages] = useState(initialSentMessages);
  const [filteredArchivedMessages, setFilteredArchivedMessages] = useState(initialArchivedMessages);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para busca avançada
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    senderId: '',
    receiverId: '',
    startDate: '',
    endDate: '',
    priority: 'all',
    folderId: 'all'
  });
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Estados para envio em massa
  const [isBulkSendOpen, setIsBulkSendOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState({ subject: '', content: '', priority: 'NORMAL' });
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  
  // Estados para estatísticas
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [messageInitialData, setMessageInitialData] = useState<{ 
    subject?: string; 
    content?: string; 
    recipientsTo?: string[];
    recipientsCC?: string[];
    recipientsBCC?: string[];
    priority?: string;
    scheduledFor?: string;
    attachments?: any[];
  } | null>(null);
  const [replyToData, setReplyToData] = useState<{ id: string; subject: string; sender: { name: string | null; email: string } } | null>(null);
  const [selectedReceivedMessage, setSelectedReceivedMessage] = useState<ReceivedMessage | null>(null);
  const [selectedSentMessage, setSelectedSentMessage] = useState<SentMessage | null>(null);
  const [selectedArchivedMessage, setSelectedArchivedMessage] = useState<ArchivedMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTemplatesListOpen, setIsTemplatesListOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [draftMessages, setDraftMessages] = useState<any[]>([]);
  const { toast } = useToast();

  // Função para recarregar mensagens após atualização
  const refreshMessages = async () => {
    try {
      // Recarregar mensagens recebidas
      const receivedRes = await fetch('/api/messages?type=received');
      if (receivedRes.ok) {
        const received = await receivedRes.json();
        setReceivedMessages(received);
      }

      // Recarregar mensagens enviadas
      const sentRes = await fetch('/api/messages?type=sent');
      if (sentRes.ok) {
        const sent = await sentRes.json();
        setSentMessages(sent);
      }

      // Recarregar mensagens arquivadas
      const archivedRes = await fetch('/api/messages?archived=true');
      if (archivedRes.ok) {
        const archived = await archivedRes.json();
        setArchivedMessages(archived);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  // Função para aplicar filtros avançados
  const applyAdvancedFilters = async () => {
    try {
      const params = new URLSearchParams();
      
      if (advancedFilters.senderId) params.append('senderId', advancedFilters.senderId);
      if (advancedFilters.receiverId) params.append('receiverId', advancedFilters.receiverId);
      if (advancedFilters.startDate) params.append('startDate', advancedFilters.startDate);
      if (advancedFilters.endDate) params.append('endDate', advancedFilters.endDate);
      if (advancedFilters.priority !== 'all') params.append('priority', advancedFilters.priority);
      if (advancedFilters.folderId !== 'all') params.append('folderId', advancedFilters.folderId);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/messages?${params.toString()}`);
      if (res.ok) {
        const filtered = await res.json();
        setFilteredReceivedMessages(filtered);
        setHasActiveFilters(true);
        setIsAdvancedSearchOpen(false);
        
        toast({
          title: getTranslation('success', language),
          description: getTranslation('filtersApplied', language) || 'Filtros aplicados com sucesso',
        });
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: getTranslation('error', language),
        description: getTranslation('errorApplyingFilters', language) || 'Erro ao aplicar filtros',
        variant: 'destructive',
      });
    }
  };

  // Função para limpar filtros
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      senderId: '',
      receiverId: '',
      startDate: '',
      endDate: '',
      priority: 'all',
      folderId: 'all'
    });
    setSearchTerm('');
    setFilteredReceivedMessages(receivedMessages);
    setHasActiveFilters(false);
    
    toast({
      title: getTranslation('success', language),
      description: getTranslation('filtersCleared', language) || 'Filtros limpos',
    });
  };

  // Função para enviar mensagens em massa
  const handleBulkSend = async () => {
    if (selectedRecipients.length === 0) {
      toast({
        title: getTranslation('error', language),
        description: 'Selecione pelo menos um destinatário',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkMessage.subject || !bulkMessage.content) {
      toast({
        title: getTranslation('error', language),
        description: 'Assunto e conteúdo são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingBulk(true);

    try {
      const res = await fetch('/api/messages/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds: selectedRecipients,
          subject: bulkMessage.subject,
          content: bulkMessage.content,
          priority: bulkMessage.priority,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: getTranslation('success', language),
          description: `${data.count} mensagens enviadas com sucesso`,
        });
        
        setIsBulkSendOpen(false);
        setSelectedRecipients([]);
        setBulkMessage({ subject: '', content: '', priority: 'NORMAL' });
        
        // Recarregar mensagens enviadas
        await refreshMessages();
      } else {
        throw new Error('Failed to send bulk messages');
      }
    } catch (error) {
      console.error('Bulk send error:', error);
      toast({
        title: getTranslation('error', language),
        description: 'Erro ao enviar mensagens em massa',
        variant: 'destructive',
      });
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Função para alternar seleção de destinatário
  const toggleRecipient = (userId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Função para selecionar todos os destinatários
  const selectAllRecipients = () => {
    setSelectedRecipients(users?.map(u => u.id) || []);
  };

  // Função para limpar seleção
  const clearRecipientSelection = () => {
    setSelectedRecipients([]);
  };

  // Função para exportar mensagens em CSV
  const handleExportCSV = async () => {
    try {
      const messagesToExport = filteredReceivedMessages.map(m => m.id);
      
      if (messagesToExport.length === 0) {
        toast({
          title: getTranslation('error', language),
          description: 'Nenhuma mensagem para exportar',
          variant: 'destructive',
        });
        return;
      }

      const res = await fetch('/api/messages/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds: messagesToExport,
          exportType: 'csv',
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mensagens_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: getTranslation('success', language),
          description: 'Mensagens exportadas com sucesso',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: getTranslation('error', language),
        description: 'Erro ao exportar mensagens',
        variant: 'destructive',
      });
    }
  };

  // Função para carregar estatísticas
  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/messages/stats?days=30');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        throw new Error('Failed to load stats');
      }
    } catch (error) {
      console.error('Stats error:', error);
      toast({
        title: getTranslation('error', language),
        description: 'Erro ao carregar estatísticas',
        variant: 'destructive',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Função para exportar mensagens em PDF (simplificado)
  const handleExportPDF = async () => {
    try {
      const messagesToExport = filteredReceivedMessages.map(m => m.id);
      
      if (messagesToExport.length === 0) {
        toast({
          title: getTranslation('error', language),
          description: 'Nenhuma mensagem para exportar',
          variant: 'destructive',
        });
        return;
      }

      // Para PDF, vamos criar uma página HTML simples que pode ser impressa
      const res = await fetch('/api/messages/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds: messagesToExport,
          exportType: 'json',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Criar HTML para impressão
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Relatório de Mensagens</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                .message { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
                .message-header { font-weight: bold; margin-bottom: 10px; }
                .message-content { margin-top: 10px; }
                .meta { color: #666; font-size: 0.9em; }
                @media print {
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>Relatório de Mensagens</h1>
              <p class="meta">Gerado em: ${new Date().toLocaleString('pt-PT')}</p>
              <button class="no-print" onclick="window.print()">Imprimir/Salvar PDF</button>
              <hr/>
              ${data.messages.map((msg: any) => `
                <div class="message">
                  <div class="message-header">
                    ${msg.subject}
                  </div>
                  <div class="meta">
                    <strong>De:</strong> ${msg.sender} | 
                    <strong>Para:</strong> ${msg.receiver} | 
                    <strong>Data:</strong> ${msg.date} |
                    <strong>Prioridade:</strong> ${msg.priority}
                  </div>
                  <div class="message-content">
                    ${msg.content}
                  </div>
                </div>
              `).join('')}
            </body>
            </html>
          `);
          printWindow.document.close();
        }

        toast({
          title: getTranslation('success', language),
          description: 'Relatório gerado. Use Ctrl+P para salvar como PDF',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: getTranslation('error', language),
        description: 'Erro ao gerar relatório',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    // Primeiro tenta ler do localStorage (persistência local)
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      // Fallback para a sessão se não houver no localStorage
      const sessionLang = session.user.language as Language;
      setLanguage(sessionLang);
      localStorage.setItem('userLanguage', sessionLang);
    }
  }, [session]);

  // Abrir automaticamente mensagem/chat quando vindo de uma notificação
  useEffect(() => {
    if (openUserId && receivedMessages?.length > 0) {
      // Encontrar a mensagem mais recente deste usuário
      const messageFromUser = receivedMessages.find(m => m?.sender?.id === openUserId);
      if (messageFromUser) {
        handleViewReceivedMessage(messageFromUser);
      }
    }
  }, [openUserId, receivedMessages]);

  // Detectar query params para responder mensagem
  useEffect(() => {
    const replyId = searchParams?.get('reply');
    const senderId = searchParams?.get('to');
    
    if (replyId && senderId) {
      console.log('🔍 Detectado reply:', { replyId, senderId });
      
      // Buscar dados da mensagem original
      fetch(`/api/messages/${replyId}`)
        .then(res => res.json())
        .then(message => {
          console.log('✅ Mensagem original carregada:', message);
          
          // Configurar dados de resposta
          setReplyToData({
            id: message.id,
            subject: message.subject,
            sender: {
              name: message.sender.name,
              email: message.sender.email
            }
          });
          
          // Abrir modal de nova mensagem
          setIsModalOpen(true);
          
          // Limpar query params da URL
          router.replace('/messages');
        })
        .catch(error => {
          console.error('❌ Erro ao carregar mensagem:', error);
          toast({
            title: language === 'pt' ? 'Erro' : 'Error',
            description: language === 'pt' 
              ? 'Não foi possível carregar a mensagem' 
              : 'Failed to load message',
            variant: 'destructive'
          });
        });
    }
  }, [searchParams, router, language]);

  useEffect(() => {
    const filteredReceived = receivedMessages?.filter(message =>
      message?.subject?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      message?.sender?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      message?.content?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
    );
    setFilteredReceivedMessages(filteredReceived);

    const filteredSent = sentMessages?.filter(message =>
      message?.subject?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      message?.receiver?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      message?.content?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
    );
    setFilteredSentMessages(filteredSent);

    let filteredArchived = archivedMessages?.filter(message => {
      const otherUser = message?.senderId === currentUserId ? message?.receiver : message?.sender;
      return (
        message?.subject?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
        otherUser?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
        message?.content?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
      );
    });

    // Filter by folder if one is selected
    if (selectedFolder && selectedFolder !== 'none') {
      filteredArchived = filteredArchived?.filter(message => message?.folderId === selectedFolder);
    } else if (selectedFolder === 'none') {
      filteredArchived = filteredArchived?.filter(message => message?.folderId === null || message?.folderId === undefined);
    }

    setFilteredArchivedMessages(filteredArchived);
  }, [receivedMessages, sentMessages, archivedMessages, searchTerm, selectedFolder, currentUserId]);

  // Carregar templates e rascunhos
  useEffect(() => {
    const loadTemplatesAndDrafts = async () => {
      try {
        // Carregar templates
        const templatesRes = await fetch('/api/message-templates');
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData);
        }

        // Carregar rascunhos
        const draftsRes = await fetch('/api/messages?drafts=true');
        if (draftsRes.ok) {
          const draftsData = await draftsRes.json();
          setDraftMessages(draftsData);
        }
      } catch (error) {
        console.error('Error loading templates/drafts:', error);
      }
    };

    loadTemplatesAndDrafts();
  }, []);

  const handleCreateMessage = () => {
    setMessageInitialData(null); // Limpar dados iniciais ao criar nova mensagem
    setReplyToData(null); // Limpar dados de resposta
    setIsModalOpen(true);
  };

  const handleMessageSaved = (savedMessage: any) => {
    // Add to sent messages (the message we just sent)
    const newSentMessage = {
      ...savedMessage,
      receiver: users.find(u => u.id === savedMessage.receiverId) || {
        id: savedMessage.receiverId,
        name: null,
        email: '',
        role: 'STAFF'
      }
    };
    setSentMessages([newSentMessage, ...sentMessages]);
    setIsModalOpen(false);
    toast({
      title: language === 'pt' ? 'Mensagem enviada' : 'Message sent',
      description: language === 'pt' ? 'Mensagem enviada com sucesso' : 'Message sent successfully',
    });
  };

  const handleViewReceivedMessage = async (message: ReceivedMessage) => {
    setSelectedReceivedMessage(message);
    setSelectedSentMessage(null);
    
    // Mark as read if not already read
    if (!message.read) {
      try {
        await fetch(`/api/messages/${message.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ read: true }),
        });

        // Update local state
        setReceivedMessages(receivedMessages?.map(m => 
          m?.id === message.id ? { ...m, read: true } : m
        ));
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const handleViewSentMessage = (message: SentMessage) => {
    setSelectedSentMessage(message);
    setSelectedReceivedMessage(null);
    setSelectedArchivedMessage(null);
  };

  const handleViewArchivedMessage = (message: ArchivedMessage) => {
    setSelectedArchivedMessage(message);
    setSelectedReceivedMessage(null);
    setSelectedSentMessage(null);
  };

  const handleArchiveMessage = async (messageId: string, archived: boolean) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive message');
      }

      // Move message between lists
      if (archived) {
        const receivedMsg = receivedMessages?.find(m => m?.id === messageId);
        const sentMsg = sentMessages?.find(m => m?.id === messageId);

        if (receivedMsg) {
          setReceivedMessages(receivedMessages?.filter(m => m?.id !== messageId));
          setArchivedMessages([{
            ...receivedMsg,
            archived: true,
            senderId: '',
            receiverId: currentUserId,
            receiver: { id: currentUserId, name: null, email: '', role: 'STAFF' }
          }, ...archivedMessages]);
        } else if (sentMsg) {
          setSentMessages(sentMessages?.filter(m => m?.id !== messageId));
          setArchivedMessages([{
            ...sentMsg,
            archived: true,
            senderId: currentUserId,
            receiverId: '',
            sender: { id: currentUserId, name: null, email: '', role: 'STAFF' }
          }, ...archivedMessages]);
        }

        toast({
          title: getTranslation('messageArchived', language),
        });
      } else {
        const archivedMsg = archivedMessages?.find(m => m?.id === messageId);
        if (archivedMsg) {
          setArchivedMessages(archivedMessages?.filter(m => m?.id !== messageId));

          if (archivedMsg.receiverId === currentUserId) {
            setReceivedMessages([{
              ...archivedMsg,
              archived: false
            }, ...receivedMessages]);
          } else {
            setSentMessages([{
              ...archivedMsg,
              archived: false
            }, ...sentMessages]);
          }
        }

        toast({
          title: getTranslation('messageUnarchived', language),
        });
      }
    } catch (error) {
      console.error('Archive message error:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao arquivar mensagem' : 'Failed to archive message',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async () => {
    if (!deletingMessage) return;

    try {
      const response = await fetch(`/api/messages/${deletingMessage}/delete`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Remove from all lists
      setReceivedMessages(receivedMessages?.filter(m => m?.id !== deletingMessage));
      setSentMessages(sentMessages?.filter(m => m?.id !== deletingMessage));
      setArchivedMessages(archivedMessages?.filter(m => m?.id !== deletingMessage));

      setDeletingMessage(null);
      setSelectedReceivedMessage(null);
      setSelectedSentMessage(null);
      setSelectedArchivedMessage(null);

      toast({
        title: getTranslation('messageDeleted', language),
      });
    } catch (error) {
      console.error('Delete message error:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao apagar mensagem' : 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const handleMoveToFolder = async (messageId: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to move message');
      }

      // Update archived messages
      setArchivedMessages(archivedMessages?.map(m => 
        m?.id === messageId 
          ? { 
              ...m, 
              folderId,
              folder: folderId ? folders?.find(f => f?.id === folderId) : null
            } 
          : m
      ));

      toast({
        title: getTranslation('messageMoved', language),
      });
    } catch (error) {
      console.error('Move message error:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao mover mensagem' : 'Failed to move message',
        variant: 'destructive',
      });
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

  const unreadCount = receivedMessages?.filter(m => !m?.read)?.length || 0;

  const renderMessageCard = (
    message: ReceivedMessage | SentMessage | ArchivedMessage | any, 
    type: 'received' | 'sent' | 'archived' | 'draft',
    onView: () => void
  ) => {
    const isSent = type === 'sent';
    const isArchived = type === 'archived';
    const isDraft = type === 'draft';
    
    const otherUser = isArchived
      ? ((message as ArchivedMessage).senderId === currentUserId 
          ? (message as ArchivedMessage).receiver 
          : (message as ArchivedMessage).sender)
      : (isSent 
          ? (message as SentMessage).receiver 
          : (message as ReceivedMessage).sender);
    
    // Só mostrar pasta se pertencer ao usuário atual (para evitar ver pastas de outros usuários)
    const messageFolder = isArchived ? (message as ArchivedMessage).folder : null;
    const folder = messageFolder?.userId === currentUserId ? messageFolder : null;
    
    return (
      <motion.div
        key={message?.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className={`hover:shadow-lg transition-shadow ${
            !isArchived && !isSent && !message?.read ? 'bg-primary/10 border-blue-200' : ''
          }`}
        >
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 cursor-pointer" onClick={onView}>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-lg font-semibold text-foreground ${
                    !isArchived && !isSent && !message?.read ? 'font-bold' : ''
                  }`}>
                    {message?.subject}
                  </h3>
                  {!isArchived && !isSent && !message?.read && (
                    <Badge className="bg-primary/100 text-white text-xs">
                      {language === 'pt' ? 'Novo' : 'New'}
                    </Badge>
                  )}
                  {isDraft && (
                    <Badge className="bg-blue-500 text-white text-xs">
                      {getTranslation('draft', language)}
                    </Badge>
                  )}
                  {folder && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: folder.color || '#3B82F6', color: folder.color || '#3B82F6' }}
                    >
                      <FolderOpen className="h-3 w-3 mr-1" />
                      {folder.name}
                    </Badge>
                  )}
                  {message?.attachments && message.attachments.length > 0 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      <Paperclip className="h-3 w-3 mr-1" />
                      {message.attachments.length}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isArchived 
                      ? ((message as ArchivedMessage).senderId === currentUserId ? <Send className="h-4 w-4" /> : <User className="h-4 w-4" />)
                      : (isSent ? <Send className="h-4 w-4" /> : <User className="h-4 w-4" />)
                    }
                    <span className="text-muted-foreground text-xs mr-1">
                      {isArchived
                        ? ((message as ArchivedMessage).senderId === currentUserId 
                            ? getTranslation('sentTo', language) 
                            : (language === 'pt' ? 'De' : 'From'))
                        : (isSent 
                            ? getTranslation('sentTo', language) 
                            : (language === 'pt' ? 'De' : 'From'))
                      }:
                    </span>
                    {otherUser?.name || otherUser?.email}
                    <Badge variant="outline" className="text-xs">
                      {getRoleTranslation(otherUser?.role)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(message?.createdAt), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>

                <p className={`text-muted-foreground text-sm line-clamp-2 ${
                  !isArchived && !isSent && !message?.read ? 'text-foreground' : ''
                }`}>
                  {stripHtml(message?.content)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                >
                  <Eye className="h-4 w-4" />
                  {language === 'pt' ? 'Ver' : 'View'}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isArchived ? (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveMessage(message?.id, true);
                          }}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {getTranslation('archive', language)}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveMessage(message?.id, false);
                          }}
                        >
                          <Inbox className="h-4 w-4 mr-2" />
                          {getTranslation('unarchive', language)}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            {getTranslation('moveToFolder', language)}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveToFolder(message?.id, null);
                              }}
                            >
                              {getTranslation('noFolder', language)}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {folders?.map(folder => (
                              <DropdownMenuItem
                                key={folder.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveToFolder(message?.id, folder.id);
                                }}
                              >
                                <div
                                  className="w-3 h-3 rounded mr-2"
                                  style={{ backgroundColor: folder.color || '#3B82F6' }}
                                />
                                {folder.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingMessage(message?.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {getTranslation('delete', language)}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title={
          <div className="flex items-center gap-3">
            {getTranslation('messages', language)}
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
        }
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTemplatesListOpen(true)} className="gap-2">
            <FileText className="h-4 w-4" />
            {getTranslation('messageTemplates', language)}
            {templates.length > 0 && (
              <Badge variant="secondary">{templates.length}</Badge>
            )}
          </Button>
          <Button variant="outline" onClick={() => setIsBulkSendOpen(true)} className="gap-2">
            <Send className="h-4 w-4" />
            {getTranslation('bulkSend', language)}
          </Button>
          <Button variant="outline" onClick={() => { setIsStatsOpen(true); loadStats(); }} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {getTranslation('messageStatistics', language)}
          </Button>
          <Button onClick={handleCreateMessage} className="gap-2">
            <Plus className="h-4 w-4" />
            {getTranslation('newMessage', language)}
          </Button>
        </div>
      </PageHeader>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'pt' ? 'Pesquisar mensagens...' : 'Search messages...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              onClick={() => setIsAdvancedSearchOpen(true)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {getTranslation('advancedSearch', language)}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAdvancedFilters}
                title={getTranslation('clearFilters', language)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  {getTranslation('exportMessages', language)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Inbox, Sent, Drafts and Archived */}
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            {getTranslation('inbox', language)}
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            {getTranslation('sent', language)}
            {sentMessages.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white text-xs">
                {sentMessages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drafts" className="gap-2">
            <FileText className="h-4 w-4" />
            {getTranslation('drafts', language)}
            {draftMessages.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white text-xs">
                {draftMessages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            <Archive className="h-4 w-4" />
            {getTranslation('archived', language)}
            {archivedMessages?.length > 0 && (
              <Badge className="ml-2 bg-accent0 text-white text-xs">
                {archivedMessages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="mt-6">
          <div className="grid gap-4">
            {filteredReceivedMessages?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {language === 'pt' ? 'Nenhuma mensagem encontrada' : 'No messages found'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'pt' ? 'Ainda não recebeu mensagens' : 'No messages received yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4"
              >
                {filteredReceivedMessages?.map((message) => 
                  renderMessageCard(message, 'received', () => handleViewReceivedMessage(message))
                )}
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* Sent Tab */}
        <TabsContent value="sent" className="mt-6">
          <div className="grid gap-4">
            {filteredSentMessages?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {language === 'pt' ? 'Nenhuma mensagem enviada' : 'No sent messages'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'pt' ? 'Ainda não enviou mensagens' : 'No messages sent yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4"
              >
                {filteredSentMessages?.map((message) => 
                  renderMessageCard(message, 'sent', () => handleViewSentMessage(message))
                )}
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="mt-6">
          <div className="grid gap-4">
            {draftMessages?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {language === 'pt' ? 'Nenhum rascunho' : 'No drafts'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'pt' ? 'Os rascunhos salvos aparecer\u00e3o aqui' : 'Saved drafts will appear here'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4"
              >
                {draftMessages?.map((message) => 
                  renderMessageCard(message, 'draft', () => {
                    console.log('📝 Abrindo rascunho:', message);
                    // Preparar dados do rascunho para o modal
                    setMessageInitialData({
                      subject: message.subject || '',
                      content: message.content || '',
                      recipientsTo: message.receiverId ? [message.receiverId] : [],
                      recipientsCC: [],
                      recipientsBCC: [],
                      priority: message.priority || 'NORMAL',
                      scheduledFor: message.scheduledFor ? new Date(message.scheduledFor).toISOString().slice(0, 16) : '',
                      attachments: message.attachments || []
                    });
                    console.log('✅ Dados do rascunho preparados para modal');
                    setIsModalOpen(true);
                  })
                )}
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Folder Manager Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <FolderManager
                    folders={folders}
                    onFolderCreated={(folder) => {
                      setFolders([folder, ...folders]);
                      toast({
                        title: getTranslation('folderCreated', language),
                      });
                    }}
                    onFolderUpdated={(updatedFolder) => {
                      setFolders(folders?.map(f => 
                        f?.id === updatedFolder.id ? updatedFolder : f
                      ));
                      toast({
                        title: language === 'pt' ? 'Pasta atualizada' : 'Folder updated',
                      });
                    }}
                    onFolderDeleted={(folderId) => {
                      setFolders(folders?.filter(f => f?.id !== folderId));
                      setSelectedFolder(null);
                      // Clear folder from archived messages
                      setArchivedMessages(archivedMessages?.map(m =>
                        m?.folderId === folderId ? { ...m, folderId: null, folder: null } : m
                      ));
                      toast({
                        title: getTranslation('folderDeleted', language),
                      });
                    }}
                    onFoldersReordered={(reorderedFolders) => {
                      setFolders(reorderedFolders);
                    }}
                    language={language}
                  />

                  {/* Folder Filter */}
                  {folders?.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h4 className="font-semibold text-sm text-foreground mb-3">
                        {language === 'pt' ? 'Filtrar por Pasta' : 'Filter by Folder'}
                      </h4>
                      <Button
                        variant={selectedFolder === null ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedFolder(null)}
                      >
                        {language === 'pt' ? 'Todas' : 'All'}
                        <Badge className="ml-auto" variant="secondary">
                          {archivedMessages?.length || 0}
                        </Badge>
                      </Button>
                      <Button
                        variant={selectedFolder === 'none' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedFolder('none')}
                      >
                        {getTranslation('noFolder', language)}
                        <Badge className="ml-auto" variant="secondary">
                          {archivedMessages?.filter(m => m?.folderId === null || m?.folderId === undefined)?.length || 0}
                        </Badge>
                      </Button>
                      {folders?.map(folder => (
                        <Button
                          key={folder.id}
                          variant={selectedFolder === folder.id ? 'default' : 'outline'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSelectedFolder(folder.id)}
                        >
                          <div
                            className="w-3 h-3 rounded mr-2"
                            style={{ backgroundColor: folder.color || '#3B82F6' }}
                          />
                          <span className="flex-1 text-left truncate">{folder.name}</span>
                          <Badge className="ml-2" variant="secondary">
                            {folder?._count?.messages || 0}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Archived Messages List */}
            <div className="lg:col-span-2">
              <div className="grid gap-4">
                {filteredArchivedMessages?.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {language === 'pt' ? 'Nenhuma mensagem arquivada' : 'No archived messages'}
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedFolder
                          ? (language === 'pt' ? 'Esta pasta está vazia' : 'This folder is empty')
                          : (language === 'pt' ? 'Arquive mensagens para organizá-las' : 'Archive messages to organize them')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid gap-4"
                  >
                    {filteredArchivedMessages?.map((message) => 
                      renderMessageCard(message, 'archived', () => handleViewArchivedMessage(message))
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Message Modal */}
      {isModalOpen && (
        <MessageModal
          users={users}
          onClose={() => {
            setIsModalOpen(false);
            setMessageInitialData(null); // Limpar dados ao fechar
            setReplyToData(null); // Limpar dados de resposta ao fechar
          }}
          onSaved={handleMessageSaved}
          language={language}
          initialData={messageInitialData}
          replyTo={replyToData}
        />
      )}

      {/* Message Details Modals */}
      {selectedReceivedMessage && (
        <MessageDetailsModal
          message={selectedReceivedMessage}
          onClose={() => setSelectedReceivedMessage(null)}
          language={language}
          onMessageUpdated={refreshMessages}
        />
      )}
      
      {selectedSentMessage && (
        <MessageDetailsModal
          message={{
            ...selectedSentMessage,
            sender: selectedSentMessage.receiver, // For sent messages, show receiver as the "other" person
          }}
          onClose={() => setSelectedSentMessage(null)}
          language={language}
          onMessageUpdated={refreshMessages}
        />
      )}

      {selectedArchivedMessage && (
        <MessageDetailsModal
          message={{
            ...selectedArchivedMessage,
            sender: selectedArchivedMessage.senderId === currentUserId
              ? selectedArchivedMessage.receiver
              : selectedArchivedMessage.sender,
          }}
          onClose={() => setSelectedArchivedMessage(null)}
          language={language}
          onMessageUpdated={refreshMessages}
        />
      )}

      {/* Templates List */}
      {isTemplatesListOpen && (
        <MessageTemplatesList
          isOpen={isTemplatesListOpen}
          onClose={() => setIsTemplatesListOpen(false)}
          onCreateNew={() => {
            setIsTemplatesListOpen(false);
            setSelectedTemplate(null);
            setIsTemplateModalOpen(true);
          }}
          onEditTemplate={(template) => {
            setIsTemplatesListOpen(false);
            setSelectedTemplate(template);
            setIsTemplateModalOpen(true);
          }}
          onUseTemplate={(template) => {
            console.log('✅ Usar template:', template);
            // Preencher modal de nova mensagem com dados do template
            setMessageInitialData({
              subject: template.subject,
              content: template.content
            });
            setIsModalOpen(true);
          }}
          templates={templates}
          onTemplatesChange={() => {
            fetch('/api/message-templates')
              .then(res => res.json())
              .then(data => setTemplates(data))
              .catch(err => console.error('Error reloading templates:', err));
          }}
          language={language}
        />
      )}

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <MessageTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setIsTemplateModalOpen(false);
            setSelectedTemplate(null);
          }}
          onSaved={(template) => {
            // Recarregar templates
            fetch('/api/message-templates')
              .then(res => res.json())
              .then(data => setTemplates(data))
              .catch(err => console.error('Error reloading templates:', err));
          }}
          language={language}
        />
      )}

      {/* Statistics Dialog */}
      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {getTranslation('messageStatistics', language)}
            </DialogTitle>
            <DialogDescription>
              Estatísticas dos últimos 30 dias
            </DialogDescription>
          </DialogHeader>
          
          {loadingStats ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : stats ? (
            <div className="grid gap-6 py-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {getTranslation('totalSent', language)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.summary.totalSent}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {getTranslation('totalReceived', language)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.summary.totalReceived}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Não Lidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.summary.unreadCount}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.summary.total}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Messages Per Day Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation('messagesPerDay', language)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-end justify-between gap-1">
                    {stats.messagesPerDay.map((day: any, index: number) => {
                      const maxValue = Math.max(...stats.messagesPerDay.map((d: any) => d.sent + d.received));
                      const height = ((day.sent + day.received) / (maxValue || 1)) * 100;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex flex-col gap-0.5" style={{ height: `${height}%` }}>
                            <div 
                              className="w-full bg-blue-500 rounded-t" 
                              style={{ height: `${(day.sent / (day.sent + day.received || 1)) * 100}%` }}
                              title={`Enviadas: ${day.sent}`}
                            />
                            <div 
                              className="w-full bg-green-500 rounded-b" 
                              style={{ height: `${(day.received / (day.sent + day.received || 1)) * 100}%` }}
                              title={`Recebidas: ${day.received}`}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">{day.date}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span>Enviadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span>Recebidas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages by Priority */}
              <Card>
                <CardHeader>
                  <CardTitle>Mensagens por Prioridade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {stats.messagesByPriority.map((priority: any) => (
                      <div key={priority.priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              priority.priority === 'URGENT' ? 'destructive' :
                              priority.priority === 'HIGH' ? 'default' :
                              priority.priority === 'NORMAL' ? 'secondary' :
                              'outline'
                            }
                          >
                            {priority.priority}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{priority._count} mensagens</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Senders */}
              {stats.topSenders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Remetentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {stats.topSenders.map((sender: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="font-medium">{sender.name}</div>
                          <Badge variant="secondary">{sender.count} mensagens</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setIsStatsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Send Dialog */}
      <Dialog open={isBulkSendOpen} onOpenChange={setIsBulkSendOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {getTranslation('bulkSend', language)}
            </DialogTitle>
            <DialogDescription>
              {getTranslation('selectRecipients', language)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Subject */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-subject">{getTranslation('subject', language)}</Label>
              <Input
                id="bulk-subject"
                value={bulkMessage.subject}
                onChange={(e) => setBulkMessage(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={getTranslation('subject', language)}
              />
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-priority">{getTranslation('priority', language)}</Label>
              <Select
                value={bulkMessage.priority}
                onValueChange={(value) => setBulkMessage(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger id="bulk-priority">
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

            {/* Content */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-content">{getTranslation('content', language)}</Label>
              <textarea
                id="bulk-content"
                value={bulkMessage.content}
                onChange={(e) => setBulkMessage(prev => ({ ...prev, content: e.target.value }))}
                placeholder={getTranslation('content', language)}
                className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Recipients Selection */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>{getTranslation('selectRecipients', language)}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllRecipients}
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearRecipientSelection}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <div className="grid gap-2">
                  {users?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                      onClick={() => toggleRecipient(user.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(user.id)}
                        onChange={() => toggleRecipient(user.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{user.name || user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedRecipients.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedRecipients.length} destinatário(s) selecionado(s)
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkSendOpen(false);
                setSelectedRecipients([]);
                setBulkMessage({ subject: '', content: '', priority: 'NORMAL' });
              }}
            >
              {getTranslation('cancel', language)}
            </Button>
            <Button
              onClick={handleBulkSend}
              disabled={isSendingBulk || selectedRecipients.length === 0}
              className="gap-2"
            >
              {isSendingBulk ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar para {selectedRecipients.length} destinatário(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Search Dialog */}
      <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {getTranslation('advancedSearch', language)}
            </DialogTitle>
            <DialogDescription>
              {getTranslation('searchFilters', language)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Sender Filter */}
            <div className="grid gap-2">
              <Label htmlFor="sender">{getTranslation('sender', language)}</Label>
              <Select
                value={advancedFilters.senderId || 'all'}
                onValueChange={(value) => 
                  setAdvancedFilters(prev => ({ ...prev, senderId: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger id="sender">
                  <SelectValue placeholder={getTranslation('sender', language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Remetentes</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Receiver Filter */}
            <div className="grid gap-2">
              <Label htmlFor="receiver">{getTranslation('receiver', language)}</Label>
              <Select
                value={advancedFilters.receiverId || 'all'}
                onValueChange={(value) => 
                  setAdvancedFilters(prev => ({ ...prev, receiverId: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger id="receiver">
                  <SelectValue placeholder={getTranslation('receiver', language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Destinatários</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">{getTranslation('startDate', language)}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={advancedFilters.startDate}
                  onChange={(e) => 
                    setAdvancedFilters(prev => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">{getTranslation('endDate', language)}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={advancedFilters.endDate}
                  onChange={(e) => 
                    setAdvancedFilters(prev => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Priority Filter */}
            <div className="grid gap-2">
              <Label htmlFor="priority">{getTranslation('priority', language)}</Label>
              <Select
                value={advancedFilters.priority}
                onValueChange={(value) => 
                  setAdvancedFilters(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder={getTranslation('priority', language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getTranslation('noPriorityFilter', language)}</SelectItem>
                  <SelectItem value="LOW">{getTranslation('priorityLow', language)}</SelectItem>
                  <SelectItem value="NORMAL">{getTranslation('priorityNormal', language)}</SelectItem>
                  <SelectItem value="HIGH">{getTranslation('priorityHigh', language)}</SelectItem>
                  <SelectItem value="URGENT">{getTranslation('priorityUrgent', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Folder Filter */}
            <div className="grid gap-2">
              <Label htmlFor="folder">{getTranslation('folders', language)}</Label>
              <Select
                value={advancedFilters.folderId}
                onValueChange={(value) => 
                  setAdvancedFilters(prev => ({ ...prev, folderId: value }))
                }
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder={getTranslation('folders', language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getTranslation('noFolderFilter', language)}</SelectItem>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={clearAdvancedFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {getTranslation('clearFilters', language)}
            </Button>
            <Button
              onClick={applyAdvancedFilters}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {getTranslation('applyFilters', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingMessage}
        onOpenChange={() => setDeletingMessage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {getTranslation('deleteMessage', language)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getTranslation('deleteConfirm', language)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {getTranslation('cancel', language)}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage}>
              {getTranslation('delete', language)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
    }
