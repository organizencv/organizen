
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { getTranslation, Language } from '@/lib/i18n';
import { Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

interface CustomStatus {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

interface CustomPriority {
  id: string;
  name: string;
  level: number;
  color: string;
  icon?: string;
}

interface CustomTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority?: string;
  customStatusId?: string | null;
  customPriorityId?: string | null;
  customTags?: Array<{ tag: CustomTag }>;
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

interface TaskModalProps {
  task: Task | null;
  users: User[];
  userRole: string;
  currentUserId: string;
  onClose: () => void;
  onSaved: (task: any) => void;
  language: Language;
}

export function TaskModal({ task, users, userRole, currentUserId, onClose, onSaved, language }: TaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(true);
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);
  const [customPriorities, setCustomPriorities] = useState<CustomPriority[]>([]);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
    status: task?.status || 'PENDING',
    priority: task?.priority || 'MEDIUM',
    userId: task?.user?.id || currentUserId,
    customStatusId: task?.customStatusId || '',
    customPriorityId: task?.customPriorityId || '',
  });
  const { toast } = useToast();

  // Buscar custom status, priorities e tags
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        const [statusRes, priorityRes, tagRes] = await Promise.all([
          fetch('/api/settings/task-statuses'),
          fetch('/api/settings/task-priorities'),
          fetch('/api/settings/task-tags'),
        ]);

        if (statusRes.ok) {
          const data = await statusRes.json();
          const activeStatuses = data.filter((s: any) => !s.isArchived);
          setCustomStatuses(activeStatuses);
          
          // Se houver custom statuses e não for edição, definir o primeiro como padrão
          if (activeStatuses.length > 0 && !task) {
            setFormData(prev => ({
              ...prev,
              customStatusId: activeStatuses[0].id
            }));
          }
        }

        if (priorityRes.ok) {
          const data = await priorityRes.json();
          const sortedPriorities = data.sort((a: CustomPriority, b: CustomPriority) => a.level - b.level);
          setCustomPriorities(sortedPriorities);
          
          // Se houver custom priorities e não for edição, definir o primeiro como padrão
          if (sortedPriorities.length > 0 && !task) {
            setFormData(prev => ({
              ...prev,
              customPriorityId: sortedPriorities[0].id
            }));
          }
        }

        if (tagRes.ok) {
          const data = await tagRes.json();
          setCustomTags(data);
        }
      } catch (error) {
        console.error('Error fetching custom fields:', error);
      } finally {
        setIsLoadingCustomFields(false);
      }
    };

    fetchCustomFields();
  }, [task]);

  // Inicializar tags selecionadas
  useEffect(() => {
    if (task?.customTags) {
      setSelectedTags(task.customTags.map(ct => ct.tag.id));
    }
  }, [task]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
        status: task.status || 'PENDING',
        priority: task.priority || 'MEDIUM',
        userId: task.user.id || '',
        customStatusId: task.customStatusId || '',
        customPriorityId: task.customPriorityId || '',
      });
      if (task.customTags) {
        setSelectedTags(task.customTags.map(ct => ct.tag.id));
      }
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PUT' : 'POST';

      const requestData: any = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        userId: formData.userId,
        customStatusId: formData.customStatusId || null,
        customPriorityId: formData.customPriorityId || null,
        customTagIds: selectedTags,
      };

      if (formData.dueDate) {
        requestData.dueDate = new Date(formData.dueDate).toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: task 
            ? (language === 'pt' ? 'Tarefa atualizada' : 'Task updated')
            : (language === 'pt' ? 'Tarefa criada' : 'Task created'),
          description: task 
            ? (language === 'pt' ? 'Tarefa atualizada com sucesso' : 'Task updated successfully')
            : (language === 'pt' ? 'Tarefa criada com sucesso' : 'Task created successfully'),
        });
        onSaved(data);
      } else {
        throw new Error(data.error || 'Failed to save task');
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

  // Filter users based on role permissions
  const availableUsers = users?.filter(user => {
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return true; // Can assign to anyone
    } else if (userRole === 'SUPERVISOR') {
      return user?.role === 'STAFF'; // Can only assign to staff
    }
    return user?.id === currentUserId; // Staff can only create for themselves
  }) || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {task 
              ? (language === 'pt' ? 'Editar Tarefa' : 'Edit Task')
              : getTranslation('newTask', language)
            }
          </DialogTitle>
          <DialogDescription>
            {task 
              ? (language === 'pt' ? 'Edite as informações da tarefa' : 'Edit task information')
              : (language === 'pt' ? 'Crie uma nova tarefa' : 'Create a new task')
            }
          </DialogDescription>
        </DialogHeader>

        {isLoadingCustomFields ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">{getTranslation('taskTitle', language)}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder={language === 'pt' ? 'Ex: Preparar relatório' : 'Ex: Prepare report'}
            />
          </div>

          <div>
            <Label htmlFor="description">{getTranslation('description', language)}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={language === 'pt' ? 'Descrição opcional da tarefa' : 'Optional task description'}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="dueDate">{getTranslation('dueDate', language)}</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
            />
          </div>

          {/* Status e Prioridade - Mostrar custom fields se existirem, senão mostrar os padrão */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">
                {customStatuses.length > 0 
                  ? (language === 'pt' ? 'Estado' : 'Status')
                  : getTranslation('status', language)
                }
              </Label>
              {customStatuses.length > 0 ? (
                <Select 
                  value={formData.customStatusId || (customStatuses[0]?.id || 'no-status')} 
                  onValueChange={(value) => handleChange('customStatusId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'pt' ? 'Selecionar estado' : 'Select status'} />
                  </SelectTrigger>
                  <SelectContent>
                    {customStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          {status.icon && <span>{status.icon}</span>}
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
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
              )}
            </div>

            <div>
              <Label htmlFor="priority">
                {customPriorities.length > 0
                  ? (language === 'pt' ? 'Prioridade' : 'Priority')
                  : getTranslation('priority', language)
                }
              </Label>
              {customPriorities.length > 0 ? (
                <Select 
                  value={formData.customPriorityId || (customPriorities[0]?.id || 'no-priority')} 
                  onValueChange={(value) => handleChange('customPriorityId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'pt' ? 'Selecionar prioridade' : 'Select priority'} />
                  </SelectTrigger>
                  <SelectContent>
                    {customPriorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id}>
                        <div className="flex items-center gap-2">
                          {priority.icon && <span>{priority.icon}</span>}
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: priority.color }}
                          />
                          <span>{priority.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
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
              )}
            </div>
          </div>

          {/* Custom Tags */}
          {customTags.length > 0 && (
            <div>
              <Label>{language === 'pt' ? 'Tags Personalizadas' : 'Custom Tags'}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {customTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: isSelected ? '#fff' : tag.color,
                      }}
                      onClick={() => {
                        setSelectedTags(prev =>
                          isSelected
                            ? prev.filter(id => id !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                    >
                      {tag.name}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {availableUsers?.length > 1 && (
            <div>
              <Label htmlFor="user">{getTranslation('assignedTo', language)}</Label>
              <Select value={formData.userId || currentUserId} onValueChange={(value) => handleChange('userId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'pt' ? 'Selecionar utilizador' : 'Select user'} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers?.filter(user => user?.id).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user?.name || user?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {getTranslation('cancel', language)}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? getTranslation('loading', language) : getTranslation('save', language)}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
