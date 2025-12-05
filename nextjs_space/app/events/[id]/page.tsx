'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTranslation, Language } from '@/lib/i18n';
import {
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  MessageSquare,
  ArrowLeft,
  Edit,
  Upload,
  Send,
  DollarSign,
  UsersIcon,
  Paperclip,
  X,
  Video,
  Mic,
  Trash2,
  ChevronDown,
  CheckSquare,
} from 'lucide-react';
import { EventModal } from '@/components/events/event-modal';
import { EventCollaboratorsModal } from '@/components/events/event-collaborators-modal';
import { EventTasksContent } from '@/components/events/event-tasks-content';
import { UserAvatar } from '@/components/user-avatar';
import { PageHeader } from '@/components/page-header';
import { ChatMessageAttachment } from '@/components/chat-message-attachment';
import { ImageLightbox } from '@/components/image-lightbox';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { pt, enUS, es, fr } from 'date-fns/locale';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [language, setLanguage] = useState<Language>('pt');
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [collaboratorsModalOpen, setCollaboratorsModalOpen] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [selectedChatFile, setSelectedChatFile] = useState<File | null>(null);
  const [chatFilePreview, setChatFilePreview] = useState<string | null>(null);
  const [isUploadingChatFile, setIsUploadingChatFile] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageName, setSelectedImageName] = useState<string>('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  const t = (key: any) => getTranslation(key, language);
  const eventId = params?.id as string;

  // Cleanup ao desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const localeMap = {
    pt,
    en: enUS,
    es,
    fr,
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      setLanguage(session.user.language as Language);
      localStorage.setItem('userLanguage', session.user.language);
    }
  }, [session]);

  const loadEvent = async () => {
    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }
      const data = await response.json();
      if (isMountedRef.current) {
        setEvent(data);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      if (isMountedRef.current) {
        toast.error(t('errorOccurred'));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadImagesWrapper = async () => {
    try {
      if (!isMountedRef.current) return;
      const response = await fetch(`/api/events/${eventId}/images`);
      if (response.ok) {
        const data = await response.json();
        
        // Gerar signed URLs para cada imagem
        const imagesWithUrls = await Promise.all(
          data.map(async (image: any) => {
            try {
              const urlResponse = await fetch(`/api/chat/download?key=${encodeURIComponent(image.cloud_storage_path)}`);
              if (urlResponse.ok) {
                const { url } = await urlResponse.json();
                return { ...image, signedUrl: url };
              }
            } catch (err) {
              console.error('Error getting signed URL for image:', err);
            }
            return image;
          })
        );
        
        if (isMountedRef.current) {
          setImages(imagesWithUrls);
        }
      }
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const loadChatMessagesWrapper = async () => {
    try {
      if (!isMountedRef.current) return;
      const response = await fetch(`/api/events/${eventId}/chat`);
      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current) {
          setChatMessages(data);
        }
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadImagesWrapper();
      loadChatMessagesWrapper();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    scrollChatToBottom();
  }, [chatMessages]);

  // Detectar posição do scroll para mostrar/esconder botão
  useEffect(() => {
    const scrollContainer = chatScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', checkChatScrollPosition);
    
    // Verificar posição inicial
    checkChatScrollPosition();

    return () => {
      scrollContainer.removeEventListener('scroll', checkChatScrollPosition);
    };
  }, [chatMessages]); // Re-anexar quando mensagens mudam

  const handleChatFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedChatFile(file);

    // Criar preview
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setChatFilePreview(null);
    }
  };

  const handleRemoveChatFile = () => {
    setSelectedChatFile(null);
    setChatFilePreview(null);
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedChatFile) return;

    setSendingMessage(true);
    try {
      let attachmentData = null;

      // Se tem ficheiro selecionado, fazer upload primeiro
      if (selectedChatFile) {
        setIsUploadingChatFile(true);
        const formData = new FormData();
        formData.append('file', selectedChatFile);

        const uploadResponse = await fetch(`/api/events/${eventId}/chat/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        attachmentData = await uploadResponse.json();
        setIsUploadingChatFile(false);
      }

      // Enviar mensagem com ou sem attachment
      const response = await fetch(`/api/events/${eventId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: newMessage,
          ...attachmentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const message = await response.json();
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
      handleRemoveChatFile();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('errorOccurred'));
    } finally {
      setSendingMessage(false);
      setIsUploadingChatFile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/events/${eventId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const image = await response.json();
      
      // Gerar signed URL para a nova imagem
      try {
        const urlResponse = await fetch(`/api/chat/download?key=${encodeURIComponent(image.cloud_storage_path)}`);
        if (urlResponse.ok) {
          const { url } = await urlResponse.json();
          image.signedUrl = url;
        }
      } catch (err) {
        console.error('Error getting signed URL for new image:', err);
      }
      
      setImages([image, ...images]);
      toast.success(t('imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('errorOccurred'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    // Impedir que o clique propague para a imagem (que abre o lightbox)
    e.stopPropagation();
    
    // Confirmar antes de deletar
    if (!confirm(t('confirmDeleteImage') || 'Tem certeza que deseja eliminar esta imagem?')) {
      return;
    }

    setDeletingImageId(imageId);
    try {
      const response = await fetch(`/api/events/${eventId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Remover imagem da lista
      setImages(images.filter(img => img.id !== imageId));
      toast.success(t('imageDeleted') || 'Imagem eliminada com sucesso');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(t('errorOccurred'));
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleOpenImage = (imageUrl: string, imageName: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageName(imageName);
    setLightboxOpen(true);
  };

  const scrollChatToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkChatScrollPosition = () => {
    const scrollContainer = chatScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Mostrar botão se estiver a mais de 200px do fim
    setShowScrollButton(distanceFromBottom > 200);
  };

  const handleScrollChatToBottom = () => {
    scrollChatToBottom();
    setShowScrollButton(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-blue-500',
      CONFIRMED: 'bg-green-500',
      IN_PROGRESS: 'bg-yellow-500',
      COMPLETED: 'bg-gray-500',
      CANCELLED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      WEDDING: 'eventWedding',
      BIRTHDAY: 'eventBirthday',
      CONFERENCE: 'eventConference',
      CORPORATE: 'eventCorporate',
      THEMED_PARTY: 'eventThemedParty',
      CONGRESS: 'eventCongress',
      OTHER: 'other',
    };
    return t(typeMap[type] || 'other');
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PLANNING: 'planning',
      CONFIRMED: 'confirmed',
      IN_PROGRESS: 'inProgress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    };
    return t(statusMap[status] || 'planning');
  };

  // Verificar se o usuário pode gerenciar o evento
  const canManage = event?.collaborators?.some(
    (c: any) => c.userId === session?.user?.id && c.canManage
  ) || ['ADMIN', 'MANAGER'].includes(session?.user?.role || '');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center py-12 text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader 
        title={event?.name || t('event')}
        showBackButton={true}
      >
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('edit')}
          </Button>
        )}
      </PageHeader>

      {/* Event Details */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {event.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{getTypeLabel(event.eventType)}</Badge>
                <Badge className={getStatusColor(event.status)}>
                  {getStatusLabel(event.status)}
                </Badge>
              </div>
            </div>
          </div>

          {event.description && (
            <p className="text-muted-foreground">{event.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('eventDate')}</p>
                <p className="font-medium">
                  {new Date(event.eventDate).toLocaleDateString(language, {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('eventLocation')}</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}

            {event.budget && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('eventBudget')}</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat(language, {
                      style: 'currency',
                      currency: 'CVE',
                    }).format(event.budget)}
                  </p>
                </div>
              </div>
            )}

            {event.estimatedGuests && (
              <div className="flex items-center gap-3">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('estimatedGuests')}</p>
                  <p className="font-medium">{event.estimatedGuests}</p>
                </div>
              </div>
            )}
          </div>

          {event.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">{t('eventNotes')}</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('eventChat')} ({event._count?.chatMessages || 0})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="h-4 w-4 mr-2" />
            {t('tasks')} ({event._count?.tasks || 0})
          </TabsTrigger>
          <TabsTrigger value="collaborators">
            <Users className="h-4 w-4 mr-2" />
            {t('eventCollaborators')} ({event._count?.collaborators || 0})
          </TabsTrigger>
          <TabsTrigger value="images">
            <ImageIcon className="h-4 w-4 mr-2" />
            {t('eventImages')} ({event._count?.images || 0})
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="p-6">
            <div className="space-y-4">
              {/* Messages */}
              <div className="relative">
                <ScrollArea className="h-[500px] pr-4" ref={chatScrollAreaRef}>
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.senderId === session?.user?.id
                        ? 'flex-row-reverse'
                        : ''
                    }`}
                  >
                    <UserAvatar user={message.sender} size="sm" />
                    <div
                      className={`flex-1 ${
                        message.senderId === session?.user?.id
                          ? 'text-right'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {message.sender?.name || message.sender?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: localeMap[language],
                          })}
                        </p>
                      </div>
                      <div
                        className={`inline-block max-w-md ${
                          message.senderId === session?.user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${message.attachmentUrl ? '' : 'p-3'} rounded-lg`}
                      >
                        {/* Attachment */}
                        {message.attachmentUrl && (
                          <ChatMessageAttachment
                            attachmentUrl={message.attachmentUrl}
                            attachmentType={message.attachmentType}
                            attachmentName={message.attachmentName}
                            attachmentSize={message.attachmentSize}
                            isOwnMessage={message.senderId === session?.user?.id}
                          />
                        )}
                        
                        {/* Text content */}
                        {message.content && (
                          <p className={`text-sm whitespace-pre-wrap ${message.attachmentUrl ? 'p-3 pt-0' : ''}`}>
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Botão para scroll */}
                {showScrollButton && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <Button
                      size="icon"
                      className="h-12 w-12 rounded-full shadow-lg"
                      onClick={handleScrollChatToBottom}
                      title={language === 'pt' ? 'Ir para mensagens recentes' : 'Go to recent messages'}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Send Message Form */}
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* File Preview */}
                {selectedChatFile && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {chatFilePreview ? (
                      selectedChatFile.type.startsWith('video/') ? (
                        <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                          <video
                            src={chatFilePreview}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Video className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-muted">
                          <Image
                            src={chatFilePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )
                    ) : (
                      <div className="w-20 h-20 rounded flex items-center justify-center bg-background">
                        {selectedChatFile.type.startsWith('audio/') ? (
                          <Mic className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <Paperclip className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedChatFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedChatFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveChatFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2">
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    onChange={handleChatFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={sendingMessage || isUploadingChatFile}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('typeMessage')}
                    rows={2}
                    disabled={sendingMessage || isUploadingChatFile}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={sendingMessage || isUploadingChatFile || (!newMessage.trim() && !selectedChatFile)}
                    size="icon"
                  >
                    {isUploadingChatFile || sendingMessage ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <EventTasksContent 
            eventId={event.id} 
            collaborators={event.collaborators || []} 
          />
        </TabsContent>

        {/* Collaborators Tab */}
        <TabsContent value="collaborators">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('eventCollaborators')}</h3>
              <Button
                onClick={() => setCollaboratorsModalOpen(true)}
                disabled={!canManage}
              >
                <Users className="h-4 w-4 mr-2" />
                {t('manageCompany')}
              </Button>
            </div>

            <div className="space-y-3">
              {event.collaborators?.map((collab: any) => (
                <div
                  key={collab.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <UserAvatar user={{ id: collab.userId }} size="md" />
                  <div>
                    <p className="font-medium">Colaborador {collab.userId.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{collab.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('eventImages')}</h3>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingImage ? t('loading') : t('uploadImages')}
                  </Button>
                </div>
              </div>

              {images.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('noEvents')}
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted group cursor-pointer"
                      onClick={() => image.signedUrl && handleOpenImage(image.signedUrl, image.fileName)}
                    >
                      {image.signedUrl ? (
                        <Image
                          src={image.signedUrl}
                          alt={image.fileName || 'Event image'}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Botão de delete - canto superior direito */}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => handleDeleteImage(image.id, e)}
                        disabled={deletingImageId === image.id}
                        className="absolute top-2 right-2 h-8 w-8 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                      >
                        {deletingImageId === image.id ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EventModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={loadEvent}
        language={language}
        event={event}
      />

      <EventCollaboratorsModal
        open={collaboratorsModalOpen}
        onClose={() => setCollaboratorsModalOpen(false)}
        eventId={eventId}
        language={language}
        canManage={canManage}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={selectedImageUrl}
        imageName={selectedImageName}
      />
    </div>
  );
}
