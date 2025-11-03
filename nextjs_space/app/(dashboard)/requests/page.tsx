'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getTranslation, Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, FileText, Clock, Calendar, Check, X, Trash2, Plus } from 'lucide-react';
import { ShiftSwapDialog } from '@/components/requests/ShiftSwapDialog';
import { TimeOffDialog } from '@/components/requests/TimeOffDialog';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface ShiftSwapRequest {
  id: string;
  status: string;
  reason: string | null;
  responseMessage: string | null;
  createdAt: string;
  reviewedAt: string | null;
  requester: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    team: { name: string } | null;
  };
  targetUser: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

interface TimeOffRequest {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  responseMessage: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    team: { name: string } | null;
  };
}

export default function RequestsPage() {
  const { data: session } = useSession() || {};
  const [language, setLanguage] = useState<Language>('pt');
  const [loading, setLoading] = useState(true);
  const [shiftSwapRequests, setShiftSwapRequests] = useState<ShiftSwapRequest[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [shiftSwapDialogOpen, setShiftSwapDialogOpen] = useState(false);
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const userRole = session?.user?.role || 'STAFF';
  const isManager = userRole === 'MANAGER' || userRole === 'ADMIN';
  
  useEffect(() => {
    if (session?.user?.language) {
      setLanguage(session.user.language as Language);
    }
    loadRequests();
  }, [session]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [shiftSwapRes, timeOffRes] = await Promise.all([
        fetch('/api/shift-swap-requests'),
        fetch('/api/time-off-requests')
      ]);

      if (shiftSwapRes.ok) {
        const data = await shiftSwapRes.json();
        setShiftSwapRequests(data);
      }

      if (timeOffRes.ok) {
        const data = await timeOffRes.json();
        setTimeOffRequests(data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (
    id: string,
    type: 'shift-swap' | 'time-off',
    status: 'APPROVED' | 'REJECTED'
  ) => {
    setActionLoading(id);
    try {
      const endpoint = type === 'shift-swap' 
        ? `/api/shift-swap-requests/${id}`
        : `/api/time-off-requests/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Erro ao atualizar solicitação');

      toast.success(`Solicitação ${status === 'APPROVED' ? 'aprovada' : 'recusada'} com sucesso!`);
      loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Erro ao atualizar solicitação');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, type: 'shift-swap' | 'time-off') => {
    if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) return;

    setActionLoading(id);
    try {
      const endpoint = type === 'shift-swap' 
        ? `/api/shift-swap-requests/${id}`
        : `/api/time-off-requests/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao cancelar solicitação');

      toast.success('Solicitação cancelada com sucesso!');
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Erro ao cancelar solicitação');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
      CANCELLED: 'outline'
    };

    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovado',
      REJECTED: 'Recusado',
      CANCELLED: 'Cancelado'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTimeOffTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      VACATION: 'Férias',
      SICK_LEAVE: 'Licença Médica',
      PERSONAL: 'Pessoal',
      OTHER: 'Outro'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{getTranslation('requests', language)}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          {getTranslation('myRequests', language)}
        </p>
      </div>

      <Tabs defaultValue="shift-swap" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="shift-swap" className="text-xs sm:text-sm px-2 sm:px-4">
            <Clock className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-1">{getTranslation('shiftSwapRequests', language)}</span>
          </TabsTrigger>
          <TabsTrigger value="time-off" className="text-xs sm:text-sm px-2 sm:px-4">
            <Calendar className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-1">{getTranslation('timeOffRequests', language)}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shift-swap" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">{getTranslation('shiftSwapRequests', language)}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Gerencie suas solicitações de troca de turno
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShiftSwapDialogOpen(true)}
                  className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{getTranslation('newShiftSwapRequest', language)}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {shiftSwapRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{getTranslation('noRequests', language)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shiftSwapRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row items-start justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          <AvatarImage src={request.requester.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {request.requester.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm sm:text-base truncate">{request.requester.name}</p>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          {request.requester.team && (
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {request.requester.team.name}
                            </p>
                          )}
                          
                          {request.reason && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                              {request.reason}
                            </p>
                          )}
                          
                          {request.responseMessage && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs sm:text-sm">
                              <strong>Resposta:</strong> {request.responseMessage}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Solicitado em {format(new Date(request.createdAt), 'PPpp', {
                              locale: language === 'pt' ? ptBR : enUS
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        {request.status === 'PENDING' && (
                          <>
                            {isManager ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApproveReject(request.id, 'shift-swap', 'APPROVED')}
                                  disabled={actionLoading === request.id}
                                  className="flex-1 sm:flex-none h-8 px-2 sm:px-3"
                                >
                                  {actionLoading === request.id ? (
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApproveReject(request.id, 'shift-swap', 'REJECTED')}
                                  disabled={actionLoading === request.id}
                                  className="flex-1 sm:flex-none h-8 px-2 sm:px-3"
                                >
                                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </>
                            ) : (
                              session?.user?.id === request.requester.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(request.id, 'shift-swap')}
                                  disabled={actionLoading === request.id}
                                  className="flex-1 sm:flex-none h-8 px-2 sm:px-3"
                                >
                                  {actionLoading === request.id ? (
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  )}
                                </Button>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time-off" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">{getTranslation('timeOffRequests', language)}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Gerencie suas solicitações de folga
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setTimeOffDialogOpen(true)}
                  className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{getTranslation('newTimeOffRequest', language)}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timeOffRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{getTranslation('noRequests', language)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeOffRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row items-start justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          <AvatarImage src={request.user.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {request.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm sm:text-base truncate">{request.user.name}</p>
                            {getStatusBadge(request.status)}
                            <Badge variant="outline" className="text-xs">{getTimeOffTypeLabel(request.type)}</Badge>
                          </div>
                          
                          {request.user.team && (
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {request.user.team.name}
                            </p>
                          )}
                          
                          <p className="text-xs sm:text-sm font-medium mt-2 break-words">
                            {format(new Date(request.startDate), 'PP', {
                              locale: language === 'pt' ? ptBR : enUS
                            })}
                            {' até '}
                            {format(new Date(request.endDate), 'PP', {
                              locale: language === 'pt' ? ptBR : enUS
                            })}
                          </p>
                          
                          {request.reason && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                              {request.reason}
                            </p>
                          )}
                          
                          {request.responseMessage && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs sm:text-sm">
                              <strong>Resposta:</strong> {request.responseMessage}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Solicitado em {format(new Date(request.createdAt), 'PPpp', {
                              locale: language === 'pt' ? ptBR : enUS
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        {request.status === 'PENDING' && (
                          <>
                            {isManager ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApproveReject(request.id, 'time-off', 'APPROVED')}
                                  disabled={actionLoading === request.id}
                                  className="flex-1 sm:flex-none h-8 px-2 sm:px-3"
                                >
                                  {actionLoading === request.id ? (
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApproveReject(request.id, 'time-off', 'REJECTED')}
                                  disabled={actionLoading === request.id}
                                  className="flex-1 sm:flex-none h-8 px-2 sm:px-3"
                                >
                                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </>
                            ) : (
                              session?.user?.id === request.user.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(request.id, 'time-off')}
                                  disabled={actionLoading === request.id}
                                  className="flex-1 sm:flex-none h-8 px-2 sm:px-3"
                                >
                                  {actionLoading === request.id ? (
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  )}
                                </Button>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ShiftSwapDialog
        open={shiftSwapDialogOpen}
        onOpenChange={setShiftSwapDialogOpen}
        onSuccess={loadRequests}
        language={language}
      />

      <TimeOffDialog
        open={timeOffDialogOpen}
        onOpenChange={setTimeOffDialogOpen}
        onSuccess={loadRequests}
        language={language}
      />
    </div>
  );
}
