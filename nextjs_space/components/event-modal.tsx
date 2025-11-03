
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTranslation, Language } from '@/lib/i18n';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Bell, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface CustomEventType {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  description: string | null;
}

interface EventModalProps {
  event: any;
  onClose: () => void;
  onSave: () => void;
  language: Language;
}

export default function EventModal({ event, onClose, onSave, language }: EventModalProps) {
  const t = (key: any) => getTranslation(key, language);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEventTypes, setIsLoadingEventTypes] = useState(true);
  const [isEditing, setIsEditing] = useState(!event);
  const [customEventTypes, setCustomEventTypes] = useState<CustomEventType[]>([]);
  const [selectedCustomType, setSelectedCustomType] = useState<string>('none');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'MEETING',
    customEventTypeId: null as string | null,
    location: '',
    color: '#3B82F6',
    allDay: false,
    reminders: [] as any[]
  });

  // Buscar tipos de eventos personalizados
  useEffect(() => {
    const fetchCustomEventTypes = async () => {
      try {
        const response = await fetch('/api/settings/event-types');
        if (response.ok) {
          const data = await response.json();
          setCustomEventTypes(data);
        }
      } catch (error) {
        console.error('Erro ao buscar tipos de eventos:', error);
      } finally {
        setIsLoadingEventTypes(false);
      }
    };

    fetchCustomEventTypes();
  }, []);

  useEffect(() => {
    if (event) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
        type: event.eventType || event.type === 'event' ? 'MEETING' : event.type,
        customEventTypeId: event.customEventTypeId || null,
        location: event.location || '',
        color: event.color || '#3B82F6',
        allDay: event.allDay || false,
        reminders: event.reminders || []
      });
      
      // Se tem tipo customizado, selecionar
      if (event.customEventTypeId) {
        setSelectedCustomType(event.customEventTypeId);
      }
    } else {
      // Definir horário padrão para novo evento
      const now = new Date();
      now.setMinutes(0);
      const end = new Date(now);
      end.setHours(end.getHours() + 1);
      
      setFormData(prev => ({
        ...prev,
        startTime: format(now, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(end, "yyyy-MM-dd'T'HH:mm")
      }));
    }
  }, [event]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(language === 'pt' ? 'Título é obrigatório' : 'Title is required');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error(language === 'pt' ? 'Horários são obrigatórios' : 'Times are required');
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (start >= end && !formData.allDay) {
      toast.error(language === 'pt' ? 'Hora de fim deve ser depois da hora de início' : 'End time must be after start time');
      return;
    }

    try {
      setIsLoading(true);

      const url = event ? `/api/events/${event.id}` : '/api/events';
      const method = event ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      toast.success(t(event ? 'eventUpdated' : 'eventCreated'));
      onSave();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(language === 'pt' ? 'Erro ao guardar evento' : 'Error saving event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteEventConfirm'))) return;

    try {
      setIsLoading(true);

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast.success(t('eventDeleted'));
      onSave();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(language === 'pt' ? 'Erro ao eliminar evento' : 'Error deleting event');
    } finally {
      setIsLoading(false);
    }
  };

  const addReminder = () => {
    const start = new Date(formData.startTime);
    start.setHours(start.getHours() - 1);
    
    setFormData(prev => ({
      ...prev,
      reminders: [
        ...prev.reminders,
        {
          time: format(start, "yyyy-MM-dd'T'HH:mm"),
          type: 'NOTIFICATION'
        }
      ]
    }));
  };

  const removeReminder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  const updateReminder = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  // Aplicar tipo de evento personalizado
  const applyCustomEventType = (typeId: string) => {
    setSelectedCustomType(typeId);

    if (typeId === 'none') {
      setFormData(prev => ({
        ...prev,
        customEventTypeId: null,
        color: '#3B82F6' // Cor padrão
      }));
      return;
    }

    const customType = customEventTypes.find(t => t.id === typeId);
    if (!customType) return;

    setFormData(prev => ({
      ...prev,
      customEventTypeId: customType.id,
      color: customType.color
    }));

    toast.success(
      language === 'pt' 
        ? `Tipo "${customType.name}" aplicado` 
        : `Type "${customType.name}" applied`
    );
  };

  const eventTypeColors = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#F59E0B', label: 'Laranja' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6B7280', label: 'Cinza' }
  ];

  const isViewMode = event && !isEditing;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode ? t('eventDetails') : event ? t('editEvent') : t('newEvent')}
          </DialogTitle>
          <DialogDescription>
            {isViewMode 
              ? language === 'pt' ? 'Detalhes do evento' : 'Event details'
              : language === 'pt' ? 'Preencha os dados do evento' : 'Fill in event details'
            }
          </DialogDescription>
        </DialogHeader>

        {isViewMode ? (
          // Modo de Visualização
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-muted-foreground">{t('eventTitle')}</div>
              <div className="text-lg font-bold mt-1">{event.title}</div>
            </div>

            {event.description && (
              <div>
                <div className="text-sm font-semibold text-muted-foreground">{t('description')}</div>
                <div className="mt-1 whitespace-pre-wrap">{event.description}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t('startTime')}
                </div>
                <div className="mt-1">
                  {format(new Date(event.start), "dd/MM/yyyy HH:mm")}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {t('endTime')}
                </div>
                <div className="mt-1">
                  {format(new Date(event.end), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
            </div>

            {event.location && (
              <div>
                <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {t('location')}
                </div>
                <div className="mt-1">{event.location}</div>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold text-muted-foreground">{t('eventType')}</div>
              <div className="mt-1">{t(event.eventType?.toLowerCase() || 'meeting')}</div>
            </div>

            {event.reminders && event.reminders.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <Bell className="h-4 w-4" />
                  {t('addReminder')}
                </div>
                <div className="mt-2 space-y-2">
                  {event.reminders.map((reminder: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      {format(new Date(reminder.time), "dd/MM/yyyy HH:mm")} - {t(reminder.type === 'EMAIL' ? 'emailReminder' : 'notification')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: event.color }}
              />
              <span className="text-sm">{t('eventColor')}</span>
            </div>
          </div>
        ) : (
          // Modo de Edição
          <div className="space-y-4">
            {/* Seletor de Tipo de Evento Personalizado */}
            {customEventTypes.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">
                    {language === 'pt' ? 'Tipo de Evento Personalizado' : 'Custom Event Type'}
                  </Label>
                </div>
                <Select 
                  value={selectedCustomType} 
                  onValueChange={applyCustomEventType}
                  disabled={isLoadingEventTypes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingEventTypes 
                        ? (language === 'pt' ? 'Carregando...' : 'Loading...')
                        : (language === 'pt' ? 'Selecionar tipo (opcional)' : 'Select type (optional)')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {language === 'pt' ? 'Nenhum (tipo básico)' : 'None (basic type)'}
                    </SelectItem>
                    {customEventTypes.map((customType) => (
                      <SelectItem key={customType.id} value={customType.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: customType.color }}
                          />
                          <span>{customType.name}</span>
                          {customType.icon && (
                            <span className="text-xs text-muted-foreground">{customType.icon}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomType !== 'none' && customEventTypes.find(t => t.id === selectedCustomType) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {language === 'pt' 
                      ? '✓ Tipo aplicado. A cor do evento foi atualizada automaticamente.'
                      : '✓ Type applied. Event color has been updated automatically.'}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="title">{t('eventTitle')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('eventTitle')}
              />
            </div>

            <div>
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('description')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">{t('startTime')} *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endTime">{t('endTime')} *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">{t('location')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder={t('location')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">{t('eventType')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEETING">{t('meeting')}</SelectItem>
                    <SelectItem value="APPOINTMENT">{t('appointment')}</SelectItem>
                    <SelectItem value="REMINDER">{t('reminder')}</SelectItem>
                    <SelectItem value="OTHER">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">{t('eventColor')}</Label>
                <div className="flex gap-2 mt-2">
                  {eventTypeColors.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: colorOption.value }))}
                      className={`w-8 h-8 rounded border-2 ${
                        formData.color === colorOption.value ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: colorOption.value }}
                      title={colorOption.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Lembretes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t('addReminder')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReminder}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addReminder')}
                </Button>
              </div>

              {formData.reminders.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3">
                  {formData.reminders.map((reminder, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          type="datetime-local"
                          value={reminder.time}
                          onChange={(e) => updateReminder(idx, 'time', e.target.value)}
                        />
                      </div>
                      <Select
                        value={reminder.type}
                        onValueChange={(value) => updateReminder(idx, 'type', value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOTIFICATION">{t('notification')}</SelectItem>
                          <SelectItem value="EMAIL">{t('emailReminder')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeReminder(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="allDay"
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="allDay" className="cursor-pointer">
                {t('allDay')}
              </Label>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {isViewMode ? (
            <>
              <Button variant="outline" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                {t('edit')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                {t('cancel')}
              </Button>
              {event && (
                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete')}
                </Button>
              )}
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? t('loading') : t('save')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
