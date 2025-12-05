'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TaskDetailsModal } from '../task-details-modal';
import { getTranslation, Language } from '@/lib/i18n';
import { Plus, Search, Calendar, Clock, AlertCircle, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface EventTasksContentProps {
  eventId: string;
  collaborators: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      role: string;
    };
  }>;
}

export function EventTasksContent({ eventId, collaborators }: EventTasksContentProps) {
  const { data: session } = useSession();
  const [language, setLanguage] = useState<Language>('pt');
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Estado para criar tarefa
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    assignedUserId: '',
  });

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

  // Carregar tarefas do evento
  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        setFilteredTasks(data);
      } else if (res.status === 403) {
        toast({
          title: getTranslation('error', language),
          description: 'Você não tem permissão para ver tarefas deste evento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [eventId]);

  // Filtrar tarefas
  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  // Criar tarefa
  const handleCreateTask = async () => {
    if (!newTask.title) {
      toast({
        title: getTranslation('error', language),
        description: 'Título é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (res.ok) {
        toast({
          title: getTranslation('success', language),
          description: 'Tarefa criada com sucesso',
        });

        setIsCreateModalOpen(false);
        setNewTask({
          title: '',
          description: '',
          dueDate: '',
          priority: 'MEDIUM',
          status: 'PENDING',
          assignedUserId: '',
        });

        await loadTasks();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create task');
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: getTranslation('error', language),
        description: error.message || 'Erro ao criar tarefa',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir detalhes da tarefa
  const handleViewTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/tasks/${taskId}`);
      if (res.ok) {
        const task = await res.json();
        setSelectedTask(task);
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading task:', error);
    }
  };

  // Atualizar tarefa após mudanças no modal
  const handleTaskUpdated = () => {
    loadTasks();
  };

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pendente', variant: 'outline' },
      IN_PROGRESS: { label: 'Em Progresso', variant: 'default' },
      COMPLETED: { label: 'Concluída', variant: 'secondary' },
      CANCELLED: { label: 'Cancelada', variant: 'destructive' },
    };

    const config = statusMap[status] || statusMap.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Obter badge de prioridade
  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Baixa', className: 'bg-blue-100 text-blue-800' },
      MEDIUM: { label: 'Média', className: 'bg-yellow-100 text-yellow-800' },
      HIGH: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      URGENT: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
    };

    const config = priorityMap[priority] || priorityMap.MEDIUM;
    return (
      <Badge className={config.className}>
        <AlertCircle className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Lista de colaboradores como usuários
  const eventUsers = collaborators.map((c) => c.user);

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                <SelectItem value="COMPLETED">Concluída</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="LOW">Baixa</SelectItem>
                <SelectItem value="MEDIUM">Média</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tarefas */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhuma tarefa encontrada
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewTask(task.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      {getStatusBadge(task.status)}
                      {task.priority && getPriorityBadge(task.priority)}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {task.user && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          {task.user.name || task.user.email}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                        </div>
                      )}
                      {task.createdAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Criar Tarefa */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Tarefa do Evento</DialogTitle>
            <DialogDescription>
              Criar tarefa exclusiva para este evento
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Título da tarefa"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Descrição da tarefa"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignedUser">Atribuir a</Label>
              <Select
                value={newTask.assignedUserId}
                onValueChange={(value) => setNewTask({ ...newTask, assignedUserId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {eventUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Tarefa */}
      {selectedTask && session && (
        <TaskDetailsModal
          task={selectedTask}
          users={eventUsers}
          userRole={session.user.role}
          currentUserId={session.user.id}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={handleTaskUpdated}
          language={language}
        />
      )}
    </div>
  );
}
