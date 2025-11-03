
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, GripVertical, Edit, Trash2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ColorPickerSimple } from './ColorPickerSimple';
import { IconPickerSimple } from './IconPickerSimple';
import { Switch } from '@/components/ui/switch';
import * as LucideIcons from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskStatus {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  order: number;
  isDefault: boolean;
  isArchived: boolean;
}

interface TaskStatusManagerProps {
  companyId?: string;
}

interface SortableItemProps {
  status: TaskStatus;
  onEdit: (status: TaskStatus) => void;
  onDelete: (status: TaskStatus) => void;
}

function SortableItem({ status, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-card border rounded-lg"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      
      <div
        className="h-8 w-8 rounded flex items-center justify-center"
        style={{ backgroundColor: status.color }}
      >
        {status.icon && getIconComponent(status.icon)}
      </div>

      <div className="flex-1">
        <p className="font-medium">{status.name}</p>
        {status.isDefault && (
          <p className="text-xs text-muted-foreground">Padrão</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(status)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(status)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TaskStatusManager({ companyId }: TaskStatusManagerProps) {
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: null as string | null,
    isDefault: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/task-statuses');
      if (!res.ok) throw new Error('Erro ao buscar status');
      const data = await res.json();
      setStatuses(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar status');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = statuses.findIndex((s) => s.id === active.id);
      const newIndex = statuses.findIndex((s) => s.id === over.id);

      const newStatuses = arrayMove(statuses, oldIndex, newIndex);
      setStatuses(newStatuses);

      // Salvar nova ordem no servidor
      try {
        const statusIds = newStatuses.map((s) => s.id);
        const res = await fetch('/api/settings/task-statuses/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statusIds }),
        });
        if (!res.ok) throw new Error('Erro ao reordenar');
        toast.success('Ordem atualizada com sucesso');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao salvar nova ordem');
        fetchStatuses(); // Reverter em caso de erro
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStatus) {
        // Editar
        const res = await fetch(`/api/settings/task-statuses/${editingStatus.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao atualizar status');
        }
        toast.success('Status atualizado com sucesso');
      } else {
        // Criar
        const res = await fetch('/api/settings/task-statuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao criar status');
        }
        toast.success('Status criado com sucesso');
      }

      setShowDialog(false);
      setEditingStatus(null);
      setFormData({ name: '', color: '#3B82F6', icon: null, isDefault: false });
      fetchStatuses();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao salvar status');
    }
  };

  const handleEdit = (status: TaskStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color,
      icon: status.icon,
      isDefault: status.isDefault,
    });
    setShowDialog(true);
  };

  const handleDelete = async (status: TaskStatus) => {
    if (!confirm(`Tem certeza que deseja deletar o status "${status.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/task-statuses/${status.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao deletar status');
      }
      toast.success('Status deletado com sucesso');
      fetchStatuses();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao deletar status');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Status de Tarefas</h3>
          <p className="text-sm text-muted-foreground">
            Customize os status das tarefas da sua empresa
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Status
        </Button>
      </div>

      {statuses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum status customizado. Use os padrões do sistema ou crie novos.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={statuses.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {statuses.map((status) => (
                <SortableItem
                  key={status.id}
                  status={status}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Editar Status' : 'Novo Status'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Em Progresso"
                required
              />
            </div>

            <ColorPickerSimple
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
              label="Cor"
            />

            <IconPickerSimple
              value={formData.icon}
              onChange={(icon) => setFormData({ ...formData, icon })}
              label="Ícone"
            />

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Status Padrão</label>
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingStatus(null);
                  setFormData({ name: '', color: '#3B82F6', icon: null, isDefault: false });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingStatus ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
