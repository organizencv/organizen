
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MessageModal } from './message-modal';
import { MessageDetailsModal } from './message-details-modal';
import { FolderManager } from './folder-manager';
import { getTranslation, Language } from '@/lib/i18n';
import { Plus, Search, MessageSquare, User, Clock, Eye, Send, Inbox, Archive, Trash2, FolderOpen, MoreVertical, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { BackButton } from './back-button';
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
    createdAt: string;
    updatedAt: string;
  } | null;
  attachments?: Attachment[];
}

interface FolderType {
  id: string;
  name: string;
  color: string | null;
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
  const { data: session } = useSession();
  const searchParams = useSearchParams();
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
  const [selectedReceivedMessage, setSelectedReceivedMessage] = useState<ReceivedMessage | null>(null);
  const [selectedSentMessage, setSelectedSentMessage] = useState<SentMessage | null>(null);
  const [selectedArchivedMessage, setSelectedArchivedMessage] = useState<ArchivedMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleCreateMessage = () => {
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
    message: ReceivedMessage | SentMessage | ArchivedMessage, 
    type: 'received' | 'sent' | 'archived',
    onView: () => void
  ) => {
    const isSent = type === 'sent';
    const isArchived = type === 'archived';
    
    const otherUser = isArchived
      ? ((message as ArchivedMessage).senderId === currentUserId 
          ? (message as ArchivedMessage).receiver 
          : (message as ArchivedMessage).sender)
      : (isSent 
          ? (message as SentMessage).receiver 
          : (message as ReceivedMessage).sender);
    
    const folder = isArchived ? (message as ArchivedMessage).folder : null;
    
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
                  {message?.content}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackRoute="/dashboard" variant="ghost" />
          </div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            {getTranslation('messages', language)}
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'pt' ? 'Gerir mensagens recebidas e enviadas' : 'Manage received and sent messages'}
          </p>
        </div>
        <Button onClick={handleCreateMessage} className="gap-2">
          <Plus className="h-4 w-4" />
          {getTranslation('newMessage', language)}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'pt' ? 'Pesquisar mensagens...' : 'Search messages...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Inbox, Sent, and Archived */}
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
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
          onClose={() => setIsModalOpen(false)}
          onSaved={handleMessageSaved}
          language={language}
        />
      )}

      {/* Message Details Modals */}
      {selectedReceivedMessage && (
        <MessageDetailsModal
          message={selectedReceivedMessage}
          onClose={() => setSelectedReceivedMessage(null)}
          language={language}
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
        />
      )}

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
