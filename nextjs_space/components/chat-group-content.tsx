'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { getTranslation, Language } from '@/lib/i18n';
import { 
  MessageCircle, 
  Search, 
  Send, 
  ArrowLeft,
  Plus, 
  Users, 
  Pin,
  PinOff,
  BellOff,
  Bell,
  Image as ImageIcon,
  Video,
  Mic,
  X,
  Paperclip,
  Check,
  CheckCheck,
  Loader2,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { PageHeader } from './page-header';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ChatMessageAttachment } from './chat-message-attachment';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  read: boolean;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    image?: string | null;
  };
}

interface Participant {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: User;
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  lastMessage: ChatMessage | null;
  pinnedMessage: ChatMessage | null;
  unreadCount: number;
}

interface ChatGroupContentProps {
  users: User[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  openConversationId?: string;
  initialConversations: Conversation[];
}

export function ChatGroupContent({ 
  users, 
  currentUserId, 
  currentUserName, 
  currentUserRole,
  openConversationId,
  initialConversations 
}: ChatGroupContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('pt');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Verificar permissão para criar grupos
  const canCreateGroup = ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(currentUserRole);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      const sessionLang = session.user.language as Language;
      setLanguage(sessionLang);
      localStorage.setItem('userLanguage', sessionLang);
    }
  }, [session]);

  // Abrir conversa automaticamente
  useEffect(() => {
    if (openConversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === openConversationId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [openConversationId, conversations]);

  // Fetch mensagens quando conversa é selecionada
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Poll para novas mensagens a cada 2 segundos
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      pollingRef.current = setInterval(() => fetchMessages(selectedConversation.id), 2000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [selectedConversation]);

  // Rastrear última conversa aberta
  const lastOpenedConversation = useRef<string | null>(null);
  
  useEffect(() => {
    // Se mudou de conversa e tem mensagens
    if (selectedConversation && messages.length > 0) {
      const conversationId = selectedConversation.id;
      
      // Verificar se é uma conversa diferente da última aberta
      const isNewConversation = lastOpenedConversation.current !== conversationId;
      
      if (isNewConversation) {
        // Atualizar referência
        lastOpenedConversation.current = conversationId;
        
        // Aguardar renderização completa das mensagens
        setTimeout(() => {
          const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            // Scroll instantâneo para o final (sem animação)
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }, 300);
      }
    }
  }, [messages, selectedConversation?.id]);

  // Detectar posição do scroll para mostrar/esconder botão
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', checkScrollPosition);
    
    // Verificar posição inicial
    checkScrollPosition();

    return () => {
      scrollContainer.removeEventListener('scroll', checkScrollPosition);
    };
  }, [messages]); // Re-anexar quando mensagens mudam

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkScrollPosition = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Mostrar botão se estiver a mais de 200px do fim
    setShowScrollButton(distanceFromBottom > 200);
  };

  const handleScrollToBottom = () => {
    scrollToBottom();
    setShowScrollButton(false);
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Se é conversa temporária, direta (formato userId1_userId2) ou 1:1, usar userId
      if (conversationId.startsWith('temp-') || conversationId.includes('_') || !selectedConversation?.isGroup) {
        let otherUserId: string | undefined;
        
        if (conversationId.startsWith('temp-')) {
          // Conversa temporária
          otherUserId = conversationId.replace('temp-', '');
        } else if (conversationId.includes('_')) {
          // Conversa direta com formato userId1_userId2
          const userIds = conversationId.split('_');
          otherUserId = userIds.find(id => id !== currentUserId);
        } else {
          // Conversa 1:1 antiga
          otherUserId = selectedConversation?.participants.find(p => p.userId !== currentUserId)?.userId;
        }
        
        if (otherUserId) {
          const response = await fetch(`/api/chat/messages?userId=${otherUserId}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          }
        }
      } else {
        // Para grupos, usar groupId
        const response = await fetch(`/api/chat/messages?groupId=${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (limite maior para vídeos - 50MB, outros 5MB)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxSizeMB = file.type.startsWith('video/') ? 50 : 5;
    
    if (file.size > maxSize) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB` : `File too large. Maximum size: ${maxSizeMB}MB`,
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    // Criar preview para imagens e vídeos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao fazer upload do arquivo' : 'Failed to upload file',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || isSending) return;

    setIsSending(true);

    try {
      let attachmentData = null;
      
      // Se tem arquivo, faz o upload primeiro
      if (selectedFile) {
        attachmentData = await uploadFile();
        if (!attachmentData) {
          setIsSending(false);
          return;
        }
      }

      // Se é conversa temporária (1:1), enviar mensagem direta
      if (selectedConversation.id.startsWith('temp-')) {
        const receiverId = selectedConversation.participants.find(
          p => p.userId !== currentUserId
        )?.userId;

        if (!receiverId) {
          throw new Error('Receiver not found');
        }

        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId,
            content: newMessage.trim() || '',
            attachmentUrl: attachmentData?.cloud_storage_path,
            attachmentType: attachmentData?.fileType,
            attachmentName: attachmentData?.fileName,
            attachmentSize: attachmentData?.fileSize
          })
        });

        if (response.ok) {
          const sentMessage = await response.json();
          
          // Adicionar mensagem localmente
          setMessages(prev => [...prev, {
            ...sentMessage,
            sender: {
              id: currentUserId,
              name: currentUserName,
              image: null
            }
          }]);
          
          setNewMessage('');
          clearFile();
          
          // Atualizar lista de conversas
          await refreshConversations();
        }
      } else if (selectedConversation.isGroup) {
        // Enviar mensagem para grupo
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: selectedConversation.id,
            content: newMessage.trim() || '',
            attachmentUrl: attachmentData?.cloud_storage_path,
            attachmentType: attachmentData?.fileType,
            attachmentName: attachmentData?.fileName,
            attachmentSize: attachmentData?.fileSize
          })
        });

        if (response.ok) {
          setNewMessage('');
          clearFile();
          fetchMessages(selectedConversation.id);
        }
      } else {
        // Conversa direta existente
        const receiverId = selectedConversation.participants.find(
          p => p.userId !== currentUserId
        )?.userId;

        if (!receiverId) {
          throw new Error('Receiver not found');
        }

        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId,
            content: newMessage.trim() || '',
            attachmentUrl: attachmentData?.cloud_storage_path,
            attachmentType: attachmentData?.fileType,
            attachmentName: attachmentData?.fileName,
            attachmentSize: attachmentData?.fileSize
          })
        });

        if (response.ok) {
          setNewMessage('');
          clearFile();
          fetchMessages(selectedConversation.id);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Falha ao enviar mensagem' : 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const refreshConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        // Converter formato antigo para novo
        const newConversations: Conversation[] = data.map((conv: any) => ({
          id: conv.user.id,
          name: null,
          isGroup: false,
          isMuted: false,
          createdAt: conv.lastMessage?.createdAt || new Date().toISOString(),
          updatedAt: conv.lastMessage?.createdAt || new Date().toISOString(),
          participants: [
            {
              id: `p1-${conv.user.id}`,
              userId: currentUserId,
              role: 'member',
              joinedAt: new Date().toISOString(),
              user: {
                id: currentUserId,
                name: currentUserName,
                email: '',
                role: currentUserRole
              }
            },
            {
              id: `p2-${conv.user.id}`,
              userId: conv.user.id,
              role: 'member',
              joinedAt: new Date().toISOString(),
              user: conv.user
            }
          ],
          lastMessage: conv.lastMessage,
          pinnedMessage: null,
          unreadCount: conv.unreadCount || 0
        }));
        setConversations(newConversations);
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Nome do grupo e membros são obrigatórios' : 'Group name and members are required',
        variant: 'destructive'
      });
      return;
    }

    if (isCreatingGroup) return; // Evitar cliques duplicados

    setIsCreatingGroup(true);

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          isGroup: true,
          memberIds: selectedMembers
        })
      });

      if (response.ok) {
        const newConv = await response.json();
        setConversations(prev => [newConv, ...prev]);
        setIsCreateGroupOpen(false);
        setGroupName('');
        setSelectedMembers([]);
        toast({
          title: language === 'pt' ? 'Sucesso' : 'Success',
          description: language === 'pt' ? 'Grupo criado com sucesso!' : 'Group created successfully!'
        });
      } else {
        // Tentar obter mensagem de erro do servidor
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: language === 'pt' ? 'Erro' : 'Error',
          description: errorData.error || (language === 'pt' ? 'Erro ao criar grupo' : 'Failed to create group'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao criar grupo. Tente novamente.' : 'Failed to create group. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          action: 'pin'
        })
      });

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Sucesso' : 'Success',
          description: language === 'pt' ? 'Mensagem fixada' : 'Message pinned'
        });
        fetchMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  const handleMuteConversation = async () => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mute',
          muted: !selectedConversation.isMuted
        })
      });

      if (response.ok) {
        setSelectedConversation(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
        toast({
          title: language === 'pt' ? 'Sucesso' : 'Success',
          description: selectedConversation.isMuted ? 
            (language === 'pt' ? 'Notificações ativadas' : 'Notifications enabled') :
            (language === 'pt' ? 'Notificações silenciadas' : 'Notifications muted')
        });
      }
    } catch (error) {
      console.error('Failed to mute conversation:', error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || isDeleting) return;

    setIsDeleting(true);

    try {
      // Determinar se é grupo ou conversa individual
      const isGroup = selectedConversation.isGroup;
      const params = isGroup 
        ? `groupId=${selectedConversation.id}` 
        : `userId=${selectedConversation.participants.find(p => p.userId !== currentUserId)?.userId}`;

      const response = await fetch(`/api/chat/conversations?${params}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Sucesso' : 'Success',
          description: isGroup 
            ? (language === 'pt' ? 'Grupo eliminado com sucesso' : 'Group deleted successfully')
            : (language === 'pt' ? 'Conversa eliminada com sucesso' : 'Conversation deleted successfully')
        });

        // Remover conversa da lista
        setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
        
        // Fechar conversa selecionada
        setSelectedConversation(null);
        setShowDeleteDialog(false);
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: language === 'pt' ? 'Erro' : 'Error',
          description: error.error || (language === 'pt' ? 'Falha ao eliminar' : 'Failed to delete')
        });
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({
        variant: 'destructive',
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Falha ao eliminar conversa' : 'Failed to delete conversation'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartConversationWithUser = (user: User) => {
    // Criar conversa temporária para exibir
    const newConversation: Conversation = {
      id: `temp-${user.id}`,
      name: null,
      isGroup: false,
      isMuted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [
        {
          id: `temp-p1-${user.id}`,
          userId: currentUserId,
          role: 'member',
          joinedAt: new Date().toISOString(),
          user: {
            id: currentUserId,
            name: currentUserName,
            email: '',
            role: currentUserRole
          }
        },
        {
          id: `temp-p2-${user.id}`,
          userId: user.id,
          role: 'member',
          joinedAt: new Date().toISOString(),
          user: user
        }
      ],
      lastMessage: null,
      pinnedMessage: null,
      unreadCount: 0
    };
    
    setSelectedConversation(newConversation);
    setSearchTerm(''); // Limpar busca
  };

  // Contar conversas por tipo
  const directConversationsCount = conversations.filter(c => !c.isGroup).length;
  const groupConversationsCount = conversations.filter(c => c.isGroup).length;

  // Se está pesquisando e não há conversas, mostrar usuários disponíveis
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'direct' && conv.isGroup) return false;
    if (activeTab === 'groups' && !conv.isGroup) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return conv.name?.toLowerCase().includes(searchLower) ||
             conv.participants.some(p => p.user.name?.toLowerCase().includes(searchLower));
    }
    
    return true;
  });

  // Filtrar usuários disponíveis baseado na pesquisa
  const availableUsers = searchTerm ? users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return user.name?.toLowerCase().includes(searchLower) || 
           user.email.toLowerCase().includes(searchLower);
  }) : [];

  // Remover usuários que já têm conversa ativa
  const usersWithoutConversation = availableUsers.filter(user => 
    !conversations.some(conv => 
      !conv.isGroup && conv.participants.some(p => p.userId === user.id)
    )
  );

  const getConversationName = (conv: Conversation) => {
    if (conv.isGroup) {
      return conv.name || (language === 'pt' ? 'Grupo' : 'Group');
    }
    const otherUser = conv.participants.find(p => p.userId !== currentUserId)?.user;
    return otherUser?.name || otherUser?.email || (language === 'pt' ? 'Utilizador' : 'User');
  };

  const getConversationImage = (conv: Conversation) => {
    if (!conv.isGroup) {
      const otherUser = conv.participants.find(p => p.userId !== currentUserId)?.user;
      return otherUser?.image;
    }
    return null;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar de conversas - FIXA */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Header fixo */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <PageHeader 
            title={getTranslation('chat', language)}
            backUrl="/dashboard"
          >
            {canCreateGroup && (
              <Button
                size="sm"
                onClick={() => setIsCreateGroupOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {language === 'pt' ? 'Grupo' : 'Group'}
              </Button>
            )}
          </PageHeader>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="gap-2">
                {language === 'pt' ? 'Todas' : 'All'}
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                  {conversations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="direct" className="gap-2">
                {language === 'pt' ? 'Diretas' : 'Direct'}
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                  {directConversationsCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                {language === 'pt' ? 'Grupos' : 'Groups'}
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                  {groupConversationsCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'pt' ? 'Pesquisar...' : 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de conversas - SCROLL */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 && usersWithoutConversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchTerm ? 
                  (language === 'pt' ? 'Nenhum resultado encontrado' : 'No results found') :
                  activeTab === 'direct' ?
                    (language === 'pt' ? 'Sem conversas diretas' : 'No direct conversations') :
                  activeTab === 'groups' ?
                    (language === 'pt' ? 'Sem grupos' : 'No groups') :
                    (language === 'pt' ? 'Sem conversas' : 'No conversations')
                }
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {activeTab === 'groups' && canCreateGroup ? 
                  (language === 'pt' ? 'Clique no botão acima para criar um grupo' : 'Click the button above to create a group') :
                  (language === 'pt' ? 'Comece a conversar com os seus colegas' : 'Start chatting with your colleagues')
                }
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={cn(
                    "p-3 mb-2 cursor-pointer hover:bg-accent transition-colors",
                    selectedConversation?.id === conv.id && "bg-accent"
                  )}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={getConversationImage(conv) || undefined} />
                      <AvatarFallback>
                        {conv.isGroup ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          getConversationName(conv)[0]?.toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-medium truncate">
                            {getConversationName(conv)}
                          </span>
                          {conv.isMuted && (
                            <BellOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="flex-shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.lastMessage.attachmentType ? (
                            <>
                              {conv.lastMessage.attachmentType === 'image' && '📷 Imagem'}
                              {conv.lastMessage.attachmentType === 'video' && '🎥 Vídeo'}
                              {conv.lastMessage.attachmentType === 'audio' && '🎵 Áudio'}
                              {conv.lastMessage.attachmentType === 'document' && '📄 Documento'}
                            </>
                          ) : (
                            conv.lastMessage.content
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Mostrar usuários disponíveis quando há pesquisa */}
              {searchTerm && usersWithoutConversation.length > 0 && (
                <>
                  {filteredConversations.length > 0 && (
                    <div className="px-3 py-2">
                      <p className="text-xs text-muted-foreground font-semibold">
                        {language === 'pt' ? 'NOVOS CONTATOS' : 'NEW CONTACTS'}
                      </p>
                    </div>
                  )}
                  {usersWithoutConversation.map((user) => (
                    <Card
                      key={user.id}
                      className="p-3 mb-2 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleStartConversationWithUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>
                            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col relative">
        {selectedConversation ? (
          <>
            {/* Header da conversa */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="flex-shrink-0"
                  title={language === 'pt' ? 'Voltar' : 'Back'}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <Avatar>
                  <AvatarImage src={getConversationImage(selectedConversation) || undefined} />
                  <AvatarFallback>
                    {selectedConversation.isGroup ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      getConversationName(selectedConversation)[0]?.toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold">{getConversationName(selectedConversation)}</h3>
                  {selectedConversation.isGroup && (
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.participants.length} {language === 'pt' ? 'membros' : 'members'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteConversation}
                  title={selectedConversation.isMuted 
                    ? (language === 'pt' ? 'Ativar notificações' : 'Enable notifications')
                    : (language === 'pt' ? 'Silenciar notificações' : 'Mute notifications')}
                >
                  {selectedConversation.isMuted ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title={language === 'pt' ? 'Eliminar conversa' : 'Delete conversation'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mensagem fixada */}
            {selectedConversation.pinnedMessage && (
              <div className="p-2 bg-accent border-b border-border flex items-center gap-2">
                <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-sm flex-1 truncate">
                  {selectedConversation.pinnedMessage.content}
                </p>
              </div>
            )}

            {/* Mensagens */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' ? 'Sem mensagens ainda' : 'No messages yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.sender.image || undefined} />
                            <AvatarFallback>
                              {msg.sender.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {!isOwn && selectedConversation.isGroup && (
                            <p className="text-xs font-semibold mb-1">
                              {msg.sender.name}
                            </p>
                          )}
                          
                          {msg.content && (
                            <p className="text-sm">{msg.content}</p>
                          )}
                          
                          {msg.attachmentUrl && msg.attachmentType && msg.attachmentName && (
                            <ChatMessageAttachment
                              attachmentUrl={msg.attachmentUrl}
                              attachmentType={msg.attachmentType}
                              attachmentName={msg.attachmentName}
                              attachmentSize={msg.attachmentSize || undefined}
                              isOwnMessage={isOwn}
                            />
                          )}
                          
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs opacity-70">
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                            {isOwn && (
                              msg.read ? (
                                <CheckCheck className="h-3 w-3 opacity-70" />
                              ) : (
                                <Check className="h-3 w-3 opacity-70" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Botão de scroll para baixo */}
            {showScrollButton && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={handleScrollToBottom}
                  title={language === 'pt' ? 'Ir para mensagens recentes' : 'Go to recent messages'}
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Input de mensagem */}
            <div className="p-4 border-t border-border bg-card space-y-3">
              {/* File Preview */}
              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  {filePreview ? (
                    selectedFile.type.startsWith('video/') ? (
                      <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                        <video
                          src={filePreview}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={filePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center w-20 h-20 bg-accent rounded flex-shrink-0">
                      <Paperclip className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={clearFile}
                    disabled={isUploading || isSending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Input Area */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*,application/pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  disabled={isSending || isUploading}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending || isUploading || !!selectedFile}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  placeholder={language === 'pt' ? 'Escreva uma mensagem...' : 'Type a message...'}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending || isUploading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                >
                  {isSending || isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {language === 'pt' ? 'Selecione um utilizador para conversar' : 'Select a user to chat with'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'pt' ? 'Comece a conversar com os seus colegas' : 'Start chatting with your colleagues'}
            </p>
          </div>
        )}
      </div>

      {/* Dialog de criar grupo */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'pt' ? 'Criar Grupo' : 'Create Group'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>{language === 'pt' ? 'Nome do Grupo' : 'Group Name'}</Label>
              <Input
                placeholder={language === 'pt' ? 'Digite o nome do grupo' : 'Enter group name'}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            <div>
              <Label>{language === 'pt' ? 'Membros' : 'Members'}</Label>
              <ScrollArea className="h-64 border rounded p-2 mt-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 p-2">
                    <Checkbox
                      checked={selectedMembers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers(prev => [...prev, user.id]);
                        } else {
                          setSelectedMembers(prev => prev.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name || user.email}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateGroupOpen(false)}
              disabled={isCreatingGroup}
            >
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !groupName.trim() || selectedMembers.length === 0}
            >
              {isCreatingGroup ? (
                <>
                  <span className="mr-2">⏳</span>
                  {language === 'pt' ? 'Criando...' : 'Creating...'}
                </>
              ) : (
                language === 'pt' ? 'Criar' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para eliminar conversa */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'pt' ? 'Eliminar conversa?' : 'Delete conversation?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedConversation?.isGroup 
                ? (language === 'pt' 
                  ? 'Esta ação irá eliminar permanentemente o grupo e todas as suas mensagens. Todos os membros perderão acesso. Esta ação não pode ser revertida.' 
                  : 'This action will permanently delete the group and all its messages. All members will lose access. This action cannot be undone.')
                : (language === 'pt' 
                  ? 'Esta ação irá eliminar permanentemente todas as mensagens desta conversa. Esta ação não pode ser revertida.' 
                  : 'This action will permanently delete all messages in this conversation. This action cannot be undone.')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'pt' ? 'Eliminando...' : 'Deleting...'}
                </>
              ) : (
                language === 'pt' ? 'Eliminar' : 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
