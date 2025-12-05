'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, Loader2 } from 'lucide-react';

interface TaskBasicInfoProps {
  task: any;
  users: any[];
  userRole: string;
  currentUserId: string;
  onUpdate: (task: any) => void;
  language: Language;
}

export function TaskBasicInfo({
  task,
  users,
  userRole,
  currentUserId,
  onUpdate,
  language
}: TaskBasicInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
    status: task?.status || 'PENDING',
    priority: task?.priority || 'MEDIUM',
    userId: task?.user?.id || currentUserId,
  });
  const { toast } = useToast();

  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || (userRole === 'SUPERVISOR' && task?.user?.role === 'STAFF');
  const isTaskCompleted = task?.status === 'COMPLETED';

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const requestData: any = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        userId: formData.userId,
      };

      if (formData.dueDate) {
        requestData.dueDate = new Date(formData.dueDate).toISOString();
      }

      const response = await fetch(`/api/tasks/${task?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Tarefa atualizada' : 'Task updated',
          description: language === 'pt' ? 'Informações atualizadas com sucesso' : 'Information updated successfully',
        });
        onUpdate(data);
        setIsEditing(false);
      } else {
        throw new Error(data.error || 'Failed to update task');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const availableUsers = users?.filter(user => {
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return true;
    } else if (userRole === 'SUPERVISOR') {
      return user?.role === 'STAFF';
    }
    return user?.id === currentUserId;
  }) || [];

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-end">
            {canEdit && (
              <Button 
                onClick={() => setIsEditing(true)} 
                size="sm" 
                className="gap-2"
                disabled={isTaskCompleted}
              >
                <Edit className="h-4 w-4" />
                {getTranslation('edit', language)}
              </Button>
            )}
          </div>
          {isTaskCompleted && (
            <p className="text-xs text-muted-foreground text-right">
              {language === 'pt' 
                ? 'Não é possível editar tarefas concluídas' 
                : 'Cannot edit completed tasks'}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">{getTranslation('taskTitle', language)}</Label>
            <p className="text-lg font-semibold mt-1">{task?.title}</p>
          </div>

          {task?.description && (
            <div>
              <Label className="text-muted-foreground">{getTranslation('description', language)}</Label>
              <p className="mt-1 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{getTranslation('status', language)}</Label>
              <p className="mt-1 capitalize">{task?.status}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">{getTranslation('priority', language)}</Label>
              <p className="mt-1 capitalize">{task?.priority || 'MEDIUM'}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">{getTranslation('assignedTo', language)}</Label>
              <p className="mt-1">{task?.user?.name || task?.user?.email}</p>
            </div>

            {task?.dueDate && (
              <div>
                <Label className="text-muted-foreground">{getTranslation('dueDate', language)}</Label>
                <p className="mt-1">{new Date(task.dueDate).toLocaleString()}</p>
              </div>
            )}

            {task?.startedAt && (
              <div>
                <Label className="text-muted-foreground">
                  {language === 'pt' ? 'Iniciada em' : 'Started at'}
                </Label>
                <p className="mt-1">{new Date(task.startedAt).toLocaleString()}</p>
              </div>
            )}

            {task?.completedAt && (
              <div>
                <Label className="text-muted-foreground">
                  {language === 'pt' ? 'Concluída em' : 'Completed at'}
                </Label>
                <p className="mt-1">{new Date(task.completedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={() => setIsEditing(false)} size="sm" variant="outline" className="gap-2">
          <X className="h-4 w-4" />
          {getTranslation('cancel', language)}
        </Button>
        <Button onClick={handleSubmit} size="sm" disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {getTranslation('save', language)}
        </Button>
      </div>

      <div>
        <Label htmlFor="title">{getTranslation('taskTitle', language)}</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">{getTranslation('description', language)}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">{getTranslation('status', language)}</Label>
          <Select value={formData.status || 'PENDING'} onValueChange={(value) => handleChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">{getTranslation('pending', language)}</SelectItem>
              <SelectItem value="IN_PROGRESS">{getTranslation('inProgress', language)}</SelectItem>
              <SelectItem value="COMPLETED">{getTranslation('completed', language)}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">{getTranslation('priority', language)}</Label>
          <Select value={formData.priority || 'MEDIUM'} onValueChange={(value) => handleChange('priority', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">{getTranslation('low', language)}</SelectItem>
              <SelectItem value="MEDIUM">{getTranslation('medium', language)}</SelectItem>
              <SelectItem value="HIGH">{getTranslation('high', language)}</SelectItem>
              <SelectItem value="URGENT">{getTranslation('urgent', language)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {availableUsers?.length > 1 && (
          <div>
            <Label htmlFor="user">{getTranslation('assignedTo', language)}</Label>
            <Select value={formData.userId || currentUserId} onValueChange={(value) => handleChange('userId', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableUsers?.map((user) => (
                  <SelectItem key={user?.id} value={user?.id || 'no-id'}>
                    {user?.name || user?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="dueDate">{getTranslation('dueDate', language)}</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => handleChange('dueDate', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
