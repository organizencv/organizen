'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CheckCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface TaskSubtasksProps {
  task: any;
  users: any[];
  userRole: string;
  currentUserId: string;
  onUpdate: (task: any) => void;
  language: Language;
}

export function TaskSubtasks({
  task,
  users,
  userRole,
  currentUserId,
  onUpdate,
  language
}: TaskSubtasksProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubtask, setNewSubtask] = useState({ title: '', userId: currentUserId });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPERVISOR';
  const isTaskCompleted = task?.status === 'COMPLETED';

  const handleAddSubtask = async () => {
    if (!newSubtask.title.trim()) return;
    if (isTaskCompleted) {
      toast({
        title: language === 'pt' ? 'Tarefa concluída' : 'Task completed',
        description: language === 'pt' 
          ? 'Não é possível criar subtarefas numa tarefa já concluída' 
          : 'Cannot create subtasks for completed tasks',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tasks/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSubtask.title,
          userId: newSubtask.userId,
          parentId: task?.id,
          status: 'PENDING'
        }),
      });

      if (response.ok) {
        const subtask = await response.json();
        
        toast({
          title: language === 'pt' ? 'Subtarefa criada' : 'Subtask created',
        });

        // Refresh task data
        const taskResponse = await fetch(`/api/tasks/${task?.id}`);
        
        if (taskResponse.ok) {
          const updatedTask = await taskResponse.json();
          // Forçar nova referência para React detectar mudança
          onUpdate({ ...updatedTask });
        }

        setNewSubtask({ title: '', userId: currentUserId });
        setIsAdding(false);
      } else {
        const errorData = await response.json();
        toast({
          title: language === 'pt' ? 'Erro' : 'Error',
          description: errorData.message || (language === 'pt' ? 'Não foi possível criar subtarefa' : 'Failed to create subtask'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm(language === 'pt' ? 'Eliminar subtarefa?' : 'Delete subtask?')) return;

    try {
      const response = await fetch(`/api/tasks/${subtaskId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Subtarefa eliminada' : 'Subtask deleted',
        });

        const taskResponse = await fetch(`/api/tasks/${task?.id}`);
        if (taskResponse.ok) {
          const updatedTask = await taskResponse.json();
          onUpdate(updatedTask);
        }
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (subtaskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Estado atualizado' : 'Status updated',
        });

        const taskResponse = await fetch(`/api/tasks/${task?.id}`);
        if (taskResponse.ok) {
          const updatedTask = await taskResponse.json();
          onUpdate(updatedTask);
        }
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-primary/10 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="space-y-2">
          <div className="flex justify-end">
            {!isAdding ? (
              <Button 
                onClick={() => setIsAdding(true)} 
                size="sm" 
                className="gap-2"
                disabled={isTaskCompleted}
              >
                <Plus className="h-4 w-4" />
                {getTranslation('addSubtask', language)}
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Input
                  placeholder={getTranslation('subtaskTitle', language)}
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  disabled={isTaskCompleted}
                />
                <Button onClick={handleAddSubtask} disabled={loading || isTaskCompleted} size="sm">
                  {getTranslation('save', language)}
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
                  {getTranslation('cancel', language)}
                </Button>
              </div>
            )}
          </div>
          {isTaskCompleted && (
            <p className="text-xs text-muted-foreground text-right">
              {language === 'pt' 
                ? 'Não é possível adicionar subtarefas a uma tarefa concluída' 
                : 'Cannot add subtasks to a completed task'}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {task?.subtasks?.length === 0 || !task?.subtasks ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {getTranslation('noSubtasks', language)}
            </CardContent>
          </Card>
        ) : (
          task?.subtasks?.map((subtask: any, index: number) => (
            <Card key={`${subtask?.id}-${index}-${task?.subtasks?.length}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{subtask?.title}</h4>
                      <Badge className={getStatusColor(subtask?.status)}>
                        {subtask?.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {subtask?.user?.name || subtask?.user?.email}
                      </div>
                      {subtask?.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(subtask.dueDate), 'dd/MM/yyyy')}
                        </div>
                      )}
                      {subtask?.startedAt && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Clock className="h-3 w-3" />
                          {language === 'pt' ? 'Iniciada:' : 'Started:'} {format(new Date(subtask.startedAt), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                      {subtask?.completedAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {language === 'pt' ? 'Concluída:' : 'Completed:'} {format(new Date(subtask.completedAt), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                    </div>
                    {subtask?.status !== 'COMPLETED' && (
                      <div className="mt-2 flex gap-2">
                        {subtask?.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(subtask?.id, 'IN_PROGRESS')}
                            className="gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {language === 'pt' ? 'Iniciar' : 'Start'}
                          </Button>
                        )}
                        {subtask?.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(subtask?.id, 'COMPLETED')}
                            className="gap-1 text-green-600"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {language === 'pt' ? 'Concluir' : 'Complete'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSubtask(subtask?.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
