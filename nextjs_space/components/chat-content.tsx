
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getTranslation, Language } from '@/lib/i18n';
import { MessageCircle, Search, Send, Circle, Clock, FileText, Download, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BackButton } from './back-button';
import { ChatAttachmentUploader } from './chat-attachment-uploader';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloud_storage_path: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

interface Conversation {
  user: User;
  lastMessage: ChatMessage;
  unreadCount: number;
  status: {
    isOnline: boolean;
    lastSeen: Date | null;
    isTyping: boolean;
  };
}

interface ChatContentProps {
  users: User[];
  currentUserId: string;
  currentUserName: string;
  openUserId?: string;
}

// Componente para preview de anexos
function AttachmentPreview({ attachment, isOwnMessage }: { attachment: Attachment; isOwnMessage: boolean }) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isImage = attachment.mimeType.startsWith('image/');
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const fetchDownloadUrl = async () => {
    if (downloadUrl || loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/chat/attachments?id=${attachment.id}`);
      if (response.ok) {
        const data = await response.json();
        setDownloadUrl(data.downloadUrl);
      }
    } catch (error) {
      console.error('Error fetching download URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    await fetchDownloadUrl();
    if (downloadUrl) {
      // Abrir em nova aba para download
      window.open(downloadUrl, '_blank');
    }
  };

  // Para imagens, carregar URL automaticamente
  useEffect(() => {
    if (isImage) {
      fetchDownloadUrl();
    }
  }, [isImage]);

  if (isImage && downloadUrl) {
    return (
      <div className="relative group cursor-pointer" onClick={handleDownload}>
        <div className={cn(
          "relative w-full max-w-xs rounded overflow-hidden",
          "border-2",
          isOwnMessage ? "border-blue-400" : "border-border"
        )}>
          <Image
            src={downloadUrl}
            alt={attachment.fileName}
            width={300}
            height={200}
            className="object-cover w-full h-auto"
            style={{ maxHeight: '300px' }}
          />
        </div>
        <p className={cn(
          "text-xs mt-1",
          isOwnMessage ? "text-blue-100" : "text-muted-foreground"
        )}>
          {attachment.fileName} • {formatFileSize(attachment.fileSize)}
        </p>
      </div>
    );
  }

  // Para outros ficheiros, mostrar botão de download
  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 p-2 rounded",
        "border transition-colors",
        isOwnMessage 
          ? "bg-blue-700 border-blue-400 hover:bg-blue-800 text-white"
          : "bg-background border-border hover:bg-muted"
      )}
    >
      <FileText className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium truncate">{attachment.fileName}</p>
        <p className={cn(
          "text-xs",
          isOwnMessage ? "text-blue-100" : "text-muted-foreground"
        )}>
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>
      {loading ? (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        <Download className="h-4 w-4 flex-shrink-0" />
      )}
    </button>
  );
}

export function ChatContent({ users, currentUserId, currentUserName, openUserId }: ChatContentProps) {
  const { data: session } = useSession();
  const [language, setLanguage] = useState<Language>('pt');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]); // NOVO
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const pollingRef = useRef<NodeJS.Timeout>();
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

  // Abrir automaticamente conversa quando vindo de uma notificação
  useEffect(() => {
    if (openUserId && users?.length > 0) {
      const userToOpen = users.find(u => u?.id === openUserId);
      if (userToOpen) {
        setSelectedUser(userToOpen);
      }
    }
  }, [openUserId, users]);

  // Set user as online when component mounts
  useEffect(() => {
    const setOnlineStatus = async (isOnline: boolean) => {
      try {
        await fetch('/api/chat/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline })
        });
      } catch (error) {
        console.error('Failed to update online status:', error);
      }
    };

    setOnlineStatus(true);

    // Set offline when user leaves
    return () => {
      setOnlineStatus(false);
    };
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
    
    // Poll for new conversations every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      
      // Poll for new messages every 2 seconds
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      pollingRef.current = setInterval(() => fetchMessages(selectedUser.id), 2000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    // Permitir enviar se houver mensagem OU anexos
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !selectedUser || isSending) return;

    setIsSending(true);
    try {
      const attachmentIds = pendingAttachments.map(a => a.id);
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: newMessage.trim() || '', // Pode estar vazio se só houver anexos
          attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined
        })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages, message]);
        setNewMessage('');
        setPendingAttachments([]); // Limpar anexos após envio
        
        // Update typing status
        await updateTypingStatus(false);
        
        // Refresh conversations to update last message
        fetchConversations();
      } else {
        toast({
          title: language === 'pt' ? 'Erro' : 'Error',
          description: language === 'pt' ? 'Erro ao enviar mensagem' : 'Failed to send message',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao enviar mensagem' : 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const updateTypingStatus = async (typing: boolean) => {
    if (!selectedUser) return;

    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTyping: typing,
          typingTo: typing ? selectedUser.id : null
        })
      });
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing status to true
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    // Set timeout to reset typing status
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
    user.email?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
  );

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'HH:mm');
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return language === 'pt' ? 'Ontem' : 'Yesterday';
    } else {
      return format(messageDate, 'dd/MM/yyyy');
    }
  };

  const selectedConversation = conversations.find(c => c.user.id === selectedUser?.id);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full">
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackRoute="/dashboard" variant="ghost" />
          </div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            {getTranslation('chat', language)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {getTranslation('chatConversations', language)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100%-5rem)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 h-full flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={getTranslation('searchUsers', language)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">
                      {getTranslation('noConversations', language)}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      {getTranslation('startChatting', language)}
                    </p>
                  </div>
                ) : (
                  conversations
                    .filter(conv => 
                      conv.user.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
                      conv.user.email?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
                    )
                    .map((conv) => (
                      <motion.div
                        key={conv.user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors',
                          selectedUser?.id === conv.user.id && 'bg-primary/10 border-2 border-blue-200'
                        )}
                        onClick={() => setSelectedUser(conv.user)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={conv.user.image || undefined} />
                              <AvatarFallback className="bg-primary/100 text-white">
                                {getInitials(conv.user.name, conv.user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <Circle 
                              className={cn(
                                "absolute -bottom-1 -right-1 h-4 w-4 fill-current",
                                conv.status.isOnline ? "text-green-500" : "text-muted-foreground"
                              )}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm truncate">
                                {conv.user.name || conv.user.email}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(conv.lastMessage.createdAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground truncate flex-1">
                                {conv.status.isTyping ? (
                                  <span className="text-primary italic">
                                    {getTranslation('typing', language)}
                                  </span>
                                ) : (
                                  <>
                                    {conv.lastMessage.senderId === currentUserId && (
                                      <span className="mr-1">{language === 'pt' ? 'Você:' : 'You:'}</span>
                                    )}
                                    {conv.lastMessage.content}
                                  </>
                                )}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge className="ml-2 bg-red-500 text-white text-xs">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                )}

                {/* Show all users if no search term */}
                {searchTerm && filteredUsers.filter(u => !conversations.find(c => c.user.id === u.id)).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                      {language === 'pt' ? 'Outros Utilizadores' : 'Other Users'}
                    </h4>
                    {filteredUsers
                      .filter(u => !conversations.find(c => c.user.id === u.id))
                      .map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors',
                            selectedUser?.id === user.id && 'bg-primary/10 border-2 border-blue-200'
                          )}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="bg-accent0 text-white">
                                {getInitials(user.name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">
                                {user.name || user.email}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {getTranslation('startNewChat', language)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 h-full flex flex-col">
          {!selectedUser ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {getTranslation('selectUserToChat', language)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {getTranslation('startChatting', language)}
                </p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={selectedUser.image || undefined} />
                      <AvatarFallback className="bg-primary/100 text-white">
                        {getInitials(selectedUser.name, selectedUser.email)}
                      </AvatarFallback>
                    </Avatar>
                    <Circle 
                      className={cn(
                        "absolute -bottom-1 -right-1 h-4 w-4 fill-current",
                        selectedConversation?.status.isOnline ? "text-green-500" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {selectedUser.name || selectedUser.email}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {selectedConversation?.status.isTyping ? (
                        <span className="text-primary">{getTranslation('typing', language)}</span>
                      ) : selectedConversation?.status.isOnline ? (
                        <span className="text-green-600">{getTranslation('online', language)}</span>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          {selectedConversation?.status.lastSeen && (
                            <>
                              {getTranslation('lastSeen', language)}{' '}
                              {formatMessageTime(selectedConversation.status.lastSeen.toString())}
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm">
                        {getTranslation('noMessages', language)}
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === currentUserId;
                        const showDate = index === 0 || 
                          new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();

                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                  {formatMessageTime(message.createdAt)}
                                </span>
                              </div>
                            )}
                            
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className={cn(
                                'flex',
                                isOwnMessage ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div
                                className={cn(
                                  'max-w-[70%] rounded-lg px-4 py-2',
                                  isOwnMessage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-muted text-foreground'
                                )}
                              >
                                {/* Texto da mensagem */}
                                {message.content && (
                                  <p className="text-sm break-words">{message.content}</p>
                                )}
                                
                                {/* Anexos */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className={cn("space-y-2", message.content && "mt-2")}>
                                    {message.attachments.map((attachment) => (
                                      <AttachmentPreview
                                        key={attachment.id}
                                        attachment={attachment}
                                        isOwnMessage={isOwnMessage}
                                      />
                                    ))}
                                  </div>
                                )}
                                
                                <span 
                                  className={cn(
                                    'text-xs mt-1 block',
                                    isOwnMessage ? 'text-blue-100' : 'text-muted-foreground'
                                  )}
                                >
                                  {format(new Date(message.createdAt), 'HH:mm')}
                                </span>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t space-y-3">
                {/* Uploader de anexos */}
                <ChatAttachmentUploader
                  attachments={pendingAttachments}
                  onAttachmentsChange={setPendingAttachments}
                  maxFiles={5}
                  maxFileSize={5 * 1024 * 1024}
                />
                
                {/* Input de mensagem */}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={getTranslation('typeMessage', language)}
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && pendingAttachments.length === 0) || isSending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {getTranslation('sendMessage', language)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
    }
