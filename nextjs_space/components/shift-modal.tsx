
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { getTranslation, Language } from '@/lib/i18n';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Shift {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  capacity?: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  assignments?: Array<{
    id: string;
    userId: string;
  }>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakDuration: number | null;
  color: string;
  description: string | null;
}

interface ShiftModalProps {
  shift: Shift | null;
  users: User[];
  userRole: string;
  currentUserId: string;
  onClose: () => void;
  onSaved: (shift: any) => void;
  language: Language;
}

export function ShiftModal({ shift, users, userRole, currentUserId, onClose, onSaved, language }: ShiftModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
  const [formData, setFormData] = useState({
    title: shift?.title || '',
    description: shift?.description || '',
    startTime: shift?.startTime ? new Date(shift.startTime).toISOString().slice(0, 16) : '',
    endTime: shift?.endTime ? new Date(shift.endTime).toISOString().slice(0, 16) : '',
    userId: shift?.user?.id || (userRole === 'SUPERVISOR' ? (users?.[0]?.id || currentUserId) : currentUserId),
    capacity: shift?.capacity || 1,
  });
  const { toast } = useToast();

  // Buscar templates disponíveis
  useEffect(() => {
    const fetchTemplates = async () => {
      if (shift) {
        setIsLoadingTemplates(false);
        return; // Não buscar templates ao editar
      }

      try {
        const response = await fetch('/api/settings/shift-templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Erro ao buscar templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [shift]);

  useEffect(() => {
    if (shift) {
      setFormData({
        title: shift.title || '',
        description: shift.description || '',
        startTime: shift.startTime ? new Date(shift.startTime).toISOString().slice(0, 16) : '',
        endTime: shift.endTime ? new Date(shift.endTime).toISOString().slice(0, 16) : '',
        userId: shift.user.id || '',
        capacity: shift.capacity || 1,
      });
    }
  }, [shift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      // Convert datetime-local to ISO string
      const startTime = new Date(formData.startTime).toISOString();
      const endTime = new Date(formData.endTime).toISOString();

      if (new Date(startTime) >= new Date(endTime)) {
        throw new Error(language === 'pt' ? 'Hora de fim deve ser após a hora de início' : 'End time must be after start time');
      }

      const url = shift ? `/api/shifts/${shift.id}` : '/api/shifts';
      const method = shift ? 'PUT' : 'POST';

      // Convert capacity to number (Prisma expects Int, not String)
      const capacity = formData.capacity ? parseInt(String(formData.capacity), 10) : null;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startTime,
          endTime,
          capacity, // Send as number instead of string
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: shift 
            ? (language === 'pt' ? 'Turno atualizado' : 'Shift updated')
            : (language === 'pt' ? 'Turno criado' : 'Shift created'),
          description: shift 
            ? (language === 'pt' ? 'Turno atualizado com sucesso' : 'Shift updated successfully')
            : (language === 'pt' ? 'Turno criado com sucesso' : 'Shift created successfully'),
        });
        onSaved(data);
      } else {
        throw new Error(data.error || 'Failed to save shift');
      }
    } catch (error) {
      console.error('Shift save error:', error);
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

  // Aplicar template selecionado
  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);

    if (templateId === 'none') {
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Criar uma data base (hoje) para combinar com os horários do template
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    // Parse startTime (HH:mm) e aplicar à data
    const [startHour, startMinute] = template.startTime.split(':');
    startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    // Parse endTime (HH:mm) e aplicar à data
    const [endHour, endMinute] = template.endTime.split(':');
    endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Se a hora de fim é menor que a de início, assumir que é no dia seguinte
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    // Atualizar formulário com dados do template
    setFormData({
      ...formData,
      title: template.name,
      description: template.description || '',
      startTime: startDate.toISOString().slice(0, 16),
      endTime: endDate.toISOString().slice(0, 16),
    });

    toast({
      title: language === 'pt' ? 'Template aplicado' : 'Template applied',
      description: language === 'pt' 
        ? `Template "${template.name}" aplicado com sucesso`
        : `Template "${template.name}" applied successfully`,
    });
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
            {shift 
              ? (language === 'pt' ? 'Editar Turno' : 'Edit Shift')
              : getTranslation('newShift', language)
            }
          </DialogTitle>
          <DialogDescription>
            {shift 
              ? (language === 'pt' ? 'Edite as informações do turno' : 'Edit shift information')
              : (language === 'pt' ? 'Crie um novo turno' : 'Create a new shift')
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Template - apenas ao criar novo turno */}
          {!shift && templates.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">
                  {language === 'pt' ? 'Usar Template' : 'Use Template'}
                </Label>
              </div>
              <Select 
                value={selectedTemplate} 
                onValueChange={applyTemplate}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingTemplates 
                      ? (language === 'pt' ? 'Carregando...' : 'Loading...')
                      : (language === 'pt' ? 'Selecionar template (opcional)' : 'Select template (optional)')
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {language === 'pt' ? 'Nenhum (criar manualmente)' : 'None (create manually)'}
                  </SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: template.color }}
                        />
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({template.startTime} - {template.endTime})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate !== 'none' && templates.find(t => t.id === selectedTemplate) && (
                <p className="text-xs text-muted-foreground mt-2">
                  {language === 'pt' 
                    ? '✓ Template aplicado. Você pode ajustar os campos abaixo conforme necessário.'
                    : '✓ Template applied. You can adjust the fields below as needed.'}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="title">{getTranslation('shiftTitle', language)}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder={language === 'pt' ? 'Ex: Turno da Manhã' : 'Ex: Morning Shift'}
            />
          </div>

          <div>
            <Label htmlFor="description">{getTranslation('description', language)}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={language === 'pt' ? 'Descrição opcional do turno' : 'Optional shift description'}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">{getTranslation('startTime', language)}</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">{getTranslation('endTime', language)}</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="capacity">
              {language === 'pt' ? 'Capacidade (N.º de Pessoas)' : 'Capacity (Number of People)'}
            </Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="100"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'pt' 
                ? 'Número máximo de colaboradores que podem ser atribuídos a este turno' 
                : 'Maximum number of collaborators that can be assigned to this shift'}
            </p>
          </div>

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
      </DialogContent>
    </Dialog>
  );
}
