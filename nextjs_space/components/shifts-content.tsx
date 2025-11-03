
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ShiftModal } from './shift-modal';
import { SortableList } from './ui/sortable-list';
import { getTranslation, Language } from '@/lib/i18n';
import { Plus, Search, Clock, Calendar, Edit, Trash2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Shift {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface ShiftsContentProps {
  shifts: Shift[];
  users: User[];
  userRole: string;
  currentUserId: string;
  openShiftId?: string;
}

export function ShiftsContent({ shifts: initialShifts, users, userRole, currentUserId, openShiftId }: ShiftsContentProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<Language>('pt');
  const [shifts, setShifts] = useState(initialShifts);
  const [filteredShifts, setFilteredShifts] = useState(initialShifts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
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

  // Abrir automaticamente turno quando vindo de uma notificação
  useEffect(() => {
    if (openShiftId && shifts?.length > 0) {
      const shift = shifts.find(s => s?.id === openShiftId);
      if (shift) {
        handleEditShift(shift);
        // Scroll to the shift
        const shiftElement = document.getElementById(`shift-${openShiftId}`);
        if (shiftElement) {
          shiftElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [openShiftId, shifts]);

  useEffect(() => {
    const filtered = shifts?.filter(shift =>
      shift?.title?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      shift?.user?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      shift?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
    );
    setFilteredShifts(filtered);
  }, [shifts, searchTerm]);

  const canCreateShifts = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPERVISOR';
  const canEditAllShifts = userRole === 'ADMIN' || userRole === 'MANAGER';

  const handleCreateShift = () => {
    setEditingShift(null);
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm(getTranslation('delete', language) + '?')) return;

    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShifts(shifts?.filter(shift => shift?.id !== shiftId));
        toast({
          title: language === 'pt' ? 'Turno eliminado' : 'Shift deleted',
          description: language === 'pt' ? 'Turno eliminado com sucesso' : 'Shift deleted successfully',
        });
      } else {
        throw new Error('Failed to delete shift');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao eliminar turno' : 'Failed to delete shift',
        variant: 'destructive',
      });
    }
  };

  const handleShiftSaved = (savedShift: any) => {
    if (editingShift) {
      setShifts(shifts?.map(shift => shift?.id === savedShift.id ? savedShift : shift));
    } else {
      setShifts([savedShift, ...shifts]);
    }
    setIsModalOpen(false);
    setEditingShift(null);
  };

  const formatShiftTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return `${format(start, 'dd/MM/yyyy HH:mm')} - ${format(end, 'HH:mm')}`;
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

  const handleReorder = async (reorderedShifts: Shift[]) => {
    // Optimistic update
    setFilteredShifts(reorderedShifts);
    setShifts(reorderedShifts);

    try {
      const orderedIds = reorderedShifts.map((shift) => shift.id);
      const response = await fetch('/api/shifts/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder shifts');
      }

      toast({
        title: language === 'pt' ? 'Ordem atualizada' : 'Order updated',
        description: language === 'pt' ? 'A ordem dos turnos foi atualizada' : 'Shifts order has been updated',
      });
    } catch (error) {
      // Revert on error
      setFilteredShifts(filteredShifts);
      setShifts(shifts);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao reordenar turnos' : 'Failed to reorder shifts',
        variant: 'destructive',
      });
    }
  };

  const renderShift = (shift: Shift) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                {shift?.title}
              </h3>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatShiftTime(shift?.startTime, shift?.endTime)}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {shift?.user?.name || shift?.user?.email}
                <Badge variant="outline" className="text-xs">
                  {getRoleTranslation(shift?.user?.role)}
                </Badge>
              </div>
            </div>

            {shift?.description && (
              <p className="text-muted-foreground text-sm">
                {shift.description}
              </p>
            )}
          </div>

          {(canEditAllShifts || (userRole === 'SUPERVISOR' && shift?.user?.role === 'STAFF')) && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditShift(shift)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                {getTranslation('edit', language)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteShift(shift?.id)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {getTranslation('delete', language)}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            {getTranslation('shifts', language)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'STAFF' 
              ? (language === 'pt' ? 'Os seus turnos atribuídos' : 'Your assigned shifts')
              : (language === 'pt' ? 'Gerir turnos da empresa' : 'Manage company shifts')
            }
          </p>
        </div>
        {canCreateShifts && (
          <Button onClick={handleCreateShift} className="gap-2">
            <Plus className="h-4 w-4" />
            {getTranslation('newShift', language)}
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'pt' ? 'Pesquisar turnos...' : 'Search shifts...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shifts Grid */}
      <div className="grid gap-4">
        {filteredShifts?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {language === 'pt' ? 'Nenhum turno encontrado' : 'No shifts found'}
              </h3>
              <p className="text-muted-foreground">
                {canCreateShifts 
                  ? (language === 'pt' ? 'Adicione o primeiro turno' : 'Add the first shift')
                  : (language === 'pt' ? 'Ainda não tem turnos atribuídos' : 'No shifts assigned yet')
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <SortableList
              items={filteredShifts}
              onReorder={handleReorder}
              renderItem={renderShift}
              getId={(shift) => shift.id}
            />
          </motion.div>
        )}
      </div>

      {/* Shift Modal */}
      {isModalOpen && (
        <ShiftModal
          shift={editingShift}
          users={users}
          userRole={userRole}
          currentUserId={currentUserId}
          onClose={() => {
            setIsModalOpen(false);
            setEditingShift(null);
          }}
          onSaved={handleShiftSaved}
          language={language}
        />
      )}
    </div>
  );
    }
