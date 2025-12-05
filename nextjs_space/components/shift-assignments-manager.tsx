
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

import { Avatar } from './ui/avatar';
import { getTranslation, Language } from '@/lib/i18n';
import { Loader2, Users, AlertTriangle, X, Search, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShiftAssignment {
  id: string;
  userId: string;
  status?: string;
  notes?: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    departmentId?: string;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  departmentId?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Conflict {
  userId: string;
  userName: string;
  conflicts: Array<{
    title: string;
    startTime: string;
    endTime: string;
  }>;
}

interface ShiftAssignmentsManagerProps {
  shiftId: string;
  shiftTitle: string;
  shiftStartTime: string;
  shiftEndTime: string;
  capacity: number;
  currentAssignments: ShiftAssignment[];
  onClose: () => void;
  onUpdated: () => void;
  language: Language;
}

export function ShiftAssignmentsManager({
  shiftId,
  shiftTitle,
  shiftStartTime,
  shiftEndTime,
  capacity,
  currentAssignments,
  onClose,
  onUpdated,
  language,
}: ShiftAssignmentsManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const { toast } = useToast();

  const t = (key: any) => getTranslation(key, language);

  // Buscar colaboradores disponíveis
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          // Filtrar usuários que já estão atribuídos
          const assignedUserIds = currentAssignments.map(a => a.userId);
          const availableUsers = data.filter((u: User) => !assignedUserIds.includes(u.id));
          setUsers(availableUsers);
        }
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
      }
    };

    fetchUsers();
    fetchDepartments();
  }, [currentAssignments]);

  // Validar conflitos em tempo real
  // Limpar conflitos quando seleção muda (validação feita na API)
  useEffect(() => {
    setConflicts([]);
  }, [selectedUserIds]);

  // Filtrar colaboradores
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = 
      departmentFilter === 'all' || user.departmentId === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddCollaborators = async () => {
    if (selectedUserIds.length === 0) {
      toast({
        title: t('error'),
        description: language === 'pt' ? 'Selecione pelo menos um colaborador' : 'Select at least one collaborator',
        variant: 'destructive',
      });
      return;
    }

    // Verificar capacidade
    const availableCapacity = capacity - currentAssignments.length;
    if (selectedUserIds.length > availableCapacity) {
      toast({
        title: t('error'),
        description: language === 'pt' 
          ? `Capacidade excedida. Disponível: ${availableCapacity}, Selecionado: ${selectedUserIds.length}`
          : `Capacity exceeded. Available: ${availableCapacity}, Selected: ${selectedUserIds.length}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/shifts/${shiftId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Se há conflitos de horário, mostrar na UI
        if (response.status === 409 && data.conflicts) {
          setConflicts(data.conflicts);
          toast({
            title: t('error'),
            description: language === 'pt' ? 'Há conflitos de horário' : 'There are schedule conflicts',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        throw new Error(data.error || 'Failed to add collaborators');
      }

      toast({
        title: t('success'),
        description: language === 'pt' 
          ? `${selectedUserIds.length} colaborador(es) adicionado(s)` 
          : `${selectedUserIds.length} collaborator(s) added`,
      });

      onUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shifts/${shiftId}/assignments?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove collaborator');
      }

      toast({
        title: t('success'),
        description: language === 'pt' ? 'Colaborador removido' : 'Collaborator removed',
      });

      onUpdated();
    } catch (error) {
      toast({
        title: t('error'),
        description: language === 'pt' ? 'Erro ao remover colaborador' : 'Error removing collaborator',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableCapacity = capacity - currentAssignments.length;
  const isAtCapacity = availableCapacity === 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {language === 'pt' ? 'Gerenciar Colaboradores' : 'Manage Collaborators'}
          </DialogTitle>
          <DialogDescription>
            {shiftTitle} • {new Date(shiftStartTime).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-4">
            {/* Indicador de Capacidade */}
            <Card className="p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' ? 'Ocupação' : 'Occupancy'}
                  </p>
                  <p className="text-2xl font-bold">
                    {currentAssignments.length}/{capacity}
                  </p>
                </div>
                <Badge variant={isAtCapacity ? 'destructive' : 'default'}>
                  {isAtCapacity 
                    ? (language === 'pt' ? 'Lotado' : 'Full')
                    : `${availableCapacity} ${language === 'pt' ? 'vagas' : 'spots'}`
                  }
                </Badge>
              </div>
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(currentAssignments.length / capacity) * 100}%` }}
                />
              </div>
            </Card>

            {/* Colaboradores Atribuídos */}
            {currentAssignments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">
                  {language === 'pt' ? 'Colaboradores Atribuídos' : 'Assigned Collaborators'}
                </h3>
                <div className="space-y-2">
                  {currentAssignments.map(assignment => (
                    <Card key={assignment.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-sm font-semibold">
                              {(assignment.user.name || assignment.user.email).charAt(0).toUpperCase()}
                            </div>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {assignment.user.name || assignment.user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCollaborator(assignment.userId)}
                          disabled={isLoading}
                          title={language === 'pt' ? 'Remover' : 'Remove'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Adicionar Colaboradores */}
            {!isAtCapacity && (
              <>
                <h3 className="text-sm font-medium mb-3">
                  {language === 'pt' ? 'Adicionar Colaboradores' : 'Add Collaborators'}
                </h3>

                {/* Filtros */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label>{language === 'pt' ? 'Pesquisar' : 'Search'}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={language === 'pt' ? 'Nome ou email...' : 'Name or email...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'pt' ? 'Departamento' : 'Department'}</Label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === 'pt' ? 'Todos' : 'All'}
                        </SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conflitos */}
                {conflicts.length > 0 && (
                  <Card className="p-3 mb-4 border-destructive">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">
                          {language === 'pt' ? 'Conflitos de Horário' : 'Schedule Conflicts'}
                        </p>
                        {conflicts.map(conflict => (
                          <div key={conflict.userId} className="mt-2 text-sm">
                            <p className="font-medium">{conflict.userName}</p>
                            {conflict.conflicts.map((c, idx) => (
                              <p key={idx} className="text-muted-foreground">
                                • {c.title} ({new Date(c.startTime).toLocaleTimeString()} - {new Date(c.endTime).toLocaleTimeString()})
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Lista de Colaboradores */}
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {language === 'pt' ? 'Nenhum colaborador disponível' : 'No collaborators available'}
                    </p>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelected = selectedUserIds.includes(user.id);
                      const hasConflict = conflicts.some(c => c.userId === user.id);

                      return (
                        <Card
                          key={user.id}
                          className={`p-3 cursor-pointer transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                          } ${hasConflict ? 'border-destructive' : ''}`}
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleUserSelection(user.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Avatar className="h-10 w-10">
                              <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-sm font-semibold">
                                {(user.name || user.email).charAt(0).toUpperCase()}
                              </div>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{user.name || user.email}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            {isSelected && !hasConflict && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                            {hasConflict && (
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </>
            )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {language === 'pt' ? 'Fechar' : 'Close'}
          </Button>
          {!isAtCapacity && selectedUserIds.length > 0 && (
            <Button onClick={handleAddCollaborators} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'pt' ? 'Adicionando...' : 'Adding...'}
                </>
              ) : (
                <>
                  {language === 'pt' ? 'Adicionar' : 'Add'} ({selectedUserIds.length})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
