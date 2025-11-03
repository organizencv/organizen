
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TaskModal } from './task-modal';
import { TaskDetailsModal } from './task-details-modal';
import { SortableList } from './ui/sortable-list';
import { getTranslation, Language } from '@/lib/i18n';
import { Plus, Search, CheckSquare, Edit, Trash2, User, Calendar, Clock, AlertCircle, MessageSquare, Paperclip, Tag, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority?: string;
  customStatus?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  customPriority?: {
    id: string;
    name: string;
    color: string;
    icon: string;
    level: number;
  } | null;
  customTags?: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  subtasks?: any[];
  comments?: any[];
  checkItems?: any[];
  tags?: any[];
  attachments?: any[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface TasksContentProps {
  tasks: Task[];
  users: User[];
  userRole: string;
  currentUserId: string;
  openTaskId?: string;
}

export function TasksContent({ tasks: initialTasks, users, userRole, currentUserId, openTaskId }: TasksContentProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<Language>('pt');
  const [tasks, setTasks] = useState(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState(initialTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
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

  // Abrir automaticamente tarefa quando vindo de uma notificação
  useEffect(() => {
    if (openTaskId && tasks?.length > 0) {
      const task = tasks.find(t => t?.id === openTaskId);
      if (task) {
        // Buscar detalhes completos da tarefa
        fetchTaskDetails(openTaskId);
      }
    }
  }, [openTaskId, tasks]);

  const fetchTaskDetails = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const taskDetails = await response.json();
        setViewingTask(taskDetails);
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  useEffect(() => {
    let filtered = tasks?.filter(task =>
      task?.title?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      task?.user?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      task?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
    );

    if (statusFilter !== 'all') {
      filtered = filtered?.filter(task => task?.status === statusFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter]);

  const canCreateTasks = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPERVISOR';
  const canEditAllTasks = userRole === 'ADMIN' || userRole === 'MANAGER';

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setIsDetailsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(getTranslation('delete', language) + '?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(tasks?.filter(task => task?.id !== taskId));
        toast({
          title: language === 'pt' ? 'Tarefa eliminada' : 'Task deleted',
          description: language === 'pt' ? 'Tarefa eliminada com sucesso' : 'Task deleted successfully',
        });
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao eliminar tarefa' : 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const handleTaskSaved = (savedTask: any) => {
    if (editingTask) {
      setTasks(tasks?.map(task => task?.id === savedTask.id ? savedTask : task));
    } else {
      setTasks([savedTask, ...tasks]);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskUpdated = (updatedTask: any) => {
    setTasks(tasks?.map(task => task?.id === updatedTask.id ? updatedTask : task));
    setViewingTask(updatedTask);
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks?.map(task => task?.id === taskId ? updatedTask : task));
        toast({
          title: language === 'pt' ? 'Estado atualizado' : 'Status updated',
          description: language === 'pt' ? 'Estado da tarefa atualizado' : 'Task status updated',
        });
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao atualizar estado' : 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'PENDING':
        return getTranslation('pending', language);
      case 'IN_PROGRESS':
        return getTranslation('inProgress', language);
      case 'COMPLETED':
        return getTranslation('completed', language);
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-primary/10 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-muted text-foreground';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-muted text-foreground';
      case 'MEDIUM':
        return 'bg-primary/10 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getPriorityTranslation = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return getTranslation('low', language);
      case 'MEDIUM':
        return getTranslation('medium', language);
      case 'HIGH':
        return getTranslation('high', language);
      case 'URGENT':
        return getTranslation('urgent', language);
      default:
        return priority;
    }
  };

  const handleReorder = async (reorderedTasks: Task[]) => {
    // Otimistic update
    setFilteredTasks(reorderedTasks);
    setTasks(reorderedTasks);

    try {
      const orderedIds = reorderedTasks.map((task) => task.id);
      const response = await fetch('/api/tasks/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder tasks');
      }

      toast({
        title: language === 'pt' ? 'Ordem atualizada' : 'Order updated',
        description: language === 'pt' ? 'A ordem das tarefas foi atualizada' : 'Tasks order has been updated',
      });
    } catch (error) {
      // Revert on error
      setFilteredTasks(filteredTasks);
      setTasks(tasks);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao reordenar tarefas' : 'Failed to reorder tasks',
        variant: 'destructive',
      });
    }
  };

  const renderTask = (task: Task) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewTask(task)}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <h3 className="text-lg font-semibold text-foreground">
                {task?.title}
              </h3>
              {task?.customStatus ? (
                <Badge style={{ backgroundColor: task.customStatus.color }}>
                  {task.customStatus.name}
                </Badge>
              ) : (
                <Badge className={getStatusColor(task?.status)}>
                  {getStatusTranslation(task?.status)}
                </Badge>
              )}
              {task?.customPriority ? (
                <Badge style={{ backgroundColor: task.customPriority.color }}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {task.customPriority.name}
                </Badge>
              ) : task?.priority ? (
                <Badge className={getPriorityColor(task.priority)}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {getPriorityTranslation(task.priority)}
                </Badge>
              ) : null}
              {task?.customTags && task.customTags.length > 0 && task.customTags.map((customTag) => (
                <Badge key={customTag.tag.id} style={{ backgroundColor: customTag.tag.color }}>
                  <Tag className="h-3 w-3 mr-1" />
                  {customTag.tag.name}
                </Badge>
              ))}
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {task?.user?.name || task?.user?.email}
                <Badge variant="outline" className="text-xs">
                  {getRoleTranslation(task?.user?.role)}
                </Badge>
              </div>
              
              {task?.dueDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm')}
                </div>
              )}
            </div>

            {task?.description && (
              <p className="text-muted-foreground text-sm line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Task Stats */}
            <div className="flex flex-wrap gap-3 mt-3">
              {(task?.subtasks?.length || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckSquare className="h-3 w-3" />
                  {task?.subtasks?.length} {language === 'pt' ? 'subtarefas' : 'subtasks'}
                </div>
              )}
              {(task?.checkItems?.length || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ListChecks className="h-3 w-3" />
                  {task?.checkItems?.filter((item: any) => item?.completed)?.length}/{task?.checkItems?.length}
                </div>
              )}
              {(task?.comments?.length || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {task?.comments?.length}
                </div>
              )}
              {(task?.attachments?.length || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  {task?.attachments?.length}
                </div>
              )}
              {(task?.tags?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task?.tags?.slice(0, 3)?.map((tag: any) => (
                    <Badge
                      key={tag?.id}
                      className="text-xs px-2 py-0"
                      style={{ backgroundColor: tag?.color, color: '#ffffff' }}
                    >
                      {tag?.name}
                    </Badge>
                  ))}
                  {(task?.tags?.length || 0) > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      +{(task?.tags?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Quick Status Update for Own Tasks */}
            {task?.user?.id === currentUserId && task?.status !== 'COMPLETED' && (
              <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                {task?.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(task?.id, 'IN_PROGRESS'); }}
                    className="gap-1 text-primary"
                  >
                    <Clock className="h-3 w-3" />
                    {language === 'pt' ? 'Iniciar' : 'Start'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(task?.id, 'COMPLETED'); }}
                  className="gap-1 text-green-600"
                >
                  <CheckSquare className="h-3 w-3" />
                  {language === 'pt' ? 'Concluir' : 'Complete'}
                </Button>
              </div>
            )}
          </div>

          {(canEditAllTasks || (userRole === 'SUPERVISOR' && task?.user?.role === 'STAFF')) && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                {getTranslation('edit', language)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task?.id); }}
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckSquare className="h-8 w-8" />
            {getTranslation('tasks', language)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'STAFF' 
              ? (language === 'pt' ? 'As suas tarefas atribuídas' : 'Your assigned tasks')
              : (language === 'pt' ? 'Gerir tarefas da empresa' : 'Manage company tasks')
            }
          </p>
        </div>
        {canCreateTasks && (
          <Button onClick={handleCreateTask} className="gap-2">
            <Plus className="h-4 w-4" />
            {getTranslation('newTask', language)}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'pt' ? 'Pesquisar tarefas...' : 'Search tasks...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'pt' ? 'Todos os estados' : 'All statuses'}</SelectItem>
                <SelectItem value="PENDING">{getTranslation('pending', language)}</SelectItem>
                <SelectItem value="IN_PROGRESS">{getTranslation('inProgress', language)}</SelectItem>
                <SelectItem value="COMPLETED">{getTranslation('completed', language)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      <div className="grid gap-4">
        {filteredTasks?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {language === 'pt' ? 'Nenhuma tarefa encontrada' : 'No tasks found'}
              </h3>
              <p className="text-muted-foreground">
                {canCreateTasks 
                  ? (language === 'pt' ? 'Adicione a primeira tarefa' : 'Add the first task')
                  : (language === 'pt' ? 'Ainda não tem tarefas atribuídas' : 'No tasks assigned yet')
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
              items={filteredTasks}
              onReorder={handleReorder}
              renderItem={renderTask}
              getId={(task) => task.id}
            />
          </motion.div>
        )}
      </div>

      {/* Task Creation/Edit Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          users={users}
          userRole={userRole}
          currentUserId={currentUserId}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSaved={handleTaskSaved}
          language={language}
        />
      )}

      {/* Task Details Modal */}
      {isDetailsModalOpen && viewingTask && (
        <TaskDetailsModal
          task={viewingTask}
          users={users}
          userRole={userRole}
          currentUserId={currentUserId}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setViewingTask(null);
          }}
          onUpdate={handleTaskUpdated}
          language={language}
        />
      )}
    </div>
  );
    }
