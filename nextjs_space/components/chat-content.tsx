
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getTranslation, Language } from '@/lib/i18n';
import { MessageCircle, Search, Send, Circle, Clock, Paperclip, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from './page-header';
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
  receiverId: string;
  read: boolean;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Arquivo muito grande. Tamanho máximo: 5MB' : 'File too large. Maximum size: 5MB',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
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

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedUser || isSending) return;

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

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: newMessage.trim() || '',
          attachmentUrl: attachmentData?.cloud_storage_path,
          attachmentType: attachmentData?.fileType,
          attachmentName: attachmentData?.fileName,
          attachmentSize: attachmentData?.fileSize
        })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages, message]);
        setNewMessage('');
        clearFile();
        
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
      <PageHeader title={getTranslation('chat', language)} />

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
                                {message.content && (
                                  <p className="text-sm break-words">{message.content}</p>
                                )}
                                {message.attachmentUrl && message.attachmentType && message.attachmentName && (
                                  <ChatMessageAttachment
                                    attachmentUrl={message.attachmentUrl}
                                    attachmentType={message.attachmentType}
                                    attachmentName={message.attachmentName}
                                    attachmentSize={message.attachmentSize || undefined}
                                    isOwnMessage={isOwnMessage}
                                  />
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
                {/* File Preview */}
                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {filePreview ? (
                      <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={filePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-20 h-20 bg-accent rounded flex-shrink-0">
                        <Paperclip className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
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
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={getTranslation('chatTypeMessage', language)}
                    className="flex-1"
                    disabled={isSending || isUploading}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                    className="gap-2"
                  >
                    {isSending || isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
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
