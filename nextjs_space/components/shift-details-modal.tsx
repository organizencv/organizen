
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { getTranslation, Language } from '@/lib/i18n';
import { 
  Clock, 
  Calendar, 
  User, 
  Users, 
  Edit, 
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { pt, enUS, es, fr } from 'date-fns/locale';

interface ShiftDetailsModalProps {
  shiftId: string;
  language: Language;
  userRole: string;
  currentUserId: string;
  onClose: () => void;
  onEdit?: (shift: any) => void;
  onDelete?: (shiftId: string) => void;
  onManage?: (shift: any) => void;
}

interface ShiftDetails {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    image?: string | null;
  };
  assignments: Array<{
    id: string;
    userId: string;
    status?: string;
    notes?: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      role: string;
      image?: string | null;
    };
  }>;
}

export function ShiftDetailsModal({
  shiftId,
  language,
  userRole,
  currentUserId,
  onClose,
  onEdit,
  onDelete,
  onManage
}: ShiftDetailsModalProps) {
  const [shift, setShift] = useState<ShiftDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShift = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/shifts/${shiftId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch shift details');
        }

        const data = await response.json();
        setShift(data);
      } catch (err) {
        console.error('Error fetching shift:', err);
        setError(language === 'pt' ? 'Erro ao carregar turno' : 'Failed to load shift');
      } finally {
        setLoading(false);
      }
    };

    if (shiftId) {
      fetchShift();
    }
  }, [shiftId, language]);

  const getLocale = () => {
    switch (language) {
      case 'pt': return pt;
      case 'en': return enUS;
      case 'es': return es;
      case 'fr': return fr;
      default: return pt;
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

  const getStatusTranslation = (status?: string) => {
    if (!status) return language === 'pt' ? 'Pendente' : 'Pending';
    
    switch (status) {
      case 'CONFIRMED':
        return language === 'pt' ? 'Confirmado' : 'Confirmed';
      case 'PENDING':
        return language === 'pt' ? 'Pendente' : 'Pending';
      case 'REJECTED':
        return language === 'pt' ? 'Rejeitado' : 'Rejected';
      default:
        return status;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatShiftTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const dateStr = format(start, 'dd/MM/yyyy', { locale: getLocale() });
    const startTimeStr = format(start, 'HH:mm');
    const endTimeStr = format(end, 'HH:mm');
    
    return { dateStr, startTimeStr, endTimeStr };
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || 
                  (userRole === 'SUPERVISOR' && shift?.user?.role === 'STAFF');

  const capacity = shift?.capacity || 1;
  const assignedCount = shift?.assignments?.length || 0;
  const isAtCapacity = assignedCount >= capacity;
  const hasMultipleCapacity = capacity > 1;

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-6">
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !shift) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'pt' ? 'Erro' : 'Error'}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">{error || (language === 'pt' ? 'Turno não encontrado' : 'Shift not found')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { dateStr, startTimeStr, endTimeStr } = formatShiftTime(shift.startTime, shift.endTime);
  const duration = calculateDuration(shift.startTime, shift.endTime);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 flex flex-col gap-0">
        {/* Header fixo */}
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-3 mb-2">
                <Calendar className="h-6 w-6 text-primary" />
                {shift.title}
                {hasMultipleCapacity && (
                  <Badge variant={isAtCapacity ? 'destructive' : 'default'} className="gap-1">
                    <Users className="h-3 w-3" />
                    {assignedCount}/{capacity}
                  </Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' ? 'Detalhes do turno' : 'Shift details'}
              </p>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                {hasMultipleCapacity && onManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManage(shift)}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {language === 'pt' ? 'Gerenciar' : 'Manage'}
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(shift)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {getTranslation('edit', language)}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(shift.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {getTranslation('delete', language)}
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6">
          <div className="space-y-6">
            {/* Informações Principais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {language === 'pt' ? 'Horário' : 'Schedule'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{dateStr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{startTimeStr} - {endTimeStr}</span>
                  <Badge variant="outline" className="ml-2">
                    {duration}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Descrição */}
            {shift.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {language === 'pt' ? 'Descrição' : 'Description'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{shift.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Responsável pelo Turno */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {language === 'pt' ? 'Atribuído a' : 'Assigned to'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {shift.user.image ? (
                      <AvatarImage src={shift.user.image} alt={shift.user.name || ''} />
                    ) : (
                      <AvatarFallback>
                        {(shift.user.name || shift.user.email || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{shift.user.name || shift.user.email}</p>
                    <p className="text-sm text-muted-foreground">{shift.user.email}</p>
                  </div>
                  <Badge variant="outline">
                    {getRoleTranslation(shift.user.role)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Colaboradores Atribuídos */}
            {hasMultipleCapacity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {language === 'pt' ? 'Colaboradores' : 'Collaborators'}
                    <Badge variant={isAtCapacity ? 'destructive' : 'default'} className="ml-2">
                      {assignedCount}/{capacity}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {assignedCount === 0 
                      ? (language === 'pt' ? 'Nenhum colaborador atribuído' : 'No collaborators assigned')
                      : (language === 'pt' 
                        ? `${assignedCount} ${assignedCount === 1 ? 'colaborador' : 'colaboradores'} ${assignedCount === 1 ? 'atribuído' : 'atribuídos'}`
                        : `${assignedCount} ${assignedCount === 1 ? 'collaborator' : 'collaborators'} assigned`
                      )
                    }
                  </CardDescription>
                </CardHeader>
                {assignedCount > 0 && (
                  <CardContent>
                    <div className="space-y-3">
                      {shift.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-9 w-9">
                            {assignment.user.image ? (
                              <AvatarImage src={assignment.user.image} alt={assignment.user.name || ''} />
                            ) : (
                              <AvatarFallback>
                                {(assignment.user.name || assignment.user.email || '?').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {assignment.user.name || assignment.user.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {assignment.user.email}
                            </p>
                            {assignment.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {assignment.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getRoleTranslation(assignment.user.role)}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(assignment.status)} className="gap-1">
                              {getStatusIcon(assignment.status)}
                              <span className="text-xs">{getStatusTranslation(assignment.status)}</span>
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
