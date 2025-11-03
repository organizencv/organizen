'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPickerSimple } from './ColorPickerSimple';
import { IconPickerSimple } from './IconPickerSimple';
import { Switch } from '@/components/ui/switch';
import { SortableList } from '@/components/ui/sortable-list';
import * as LucideIcons from 'lucide-react';

interface TaskPriority {
  id: string;
  name: string;
  level: number;
  color: string;
  icon: string | null;
  isDefault: boolean;
}

const LEVEL_LABELS: { [key: number]: string } = {
  1: 'Baixa',
  2: 'Média',
  3: 'Alta',
  4: 'Urgente',
  5: 'Crítica',
};

export function TaskPriorityManager() {
  const [priorities, setPriorities] = useState<TaskPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPriority, setEditingPriority] = useState<TaskPriority | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 2,
    color: '#3B82F6',
    icon: null as string | null,
    isDefault: false,
  });

  useEffect(() => {
    fetchPriorities();
  }, []);

  const fetchPriorities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/task-priorities');
      if (!res.ok) throw new Error('Erro ao buscar prioridades');
      const data = await res.json();
      setPriorities(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar prioridades');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (reorderedPriorities: TaskPriority[]) => {
    setPriorities(reorderedPriorities);

    try {
      const priorityIds = reorderedPriorities.map((p) => p.id);
      const res = await fetch('/api/settings/task-priorities/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priorityIds }),
      });
      if (!res.ok) throw new Error('Erro ao reordenar');
      toast.success('Ordem atualizada com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar nova ordem');
      fetchPriorities();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPriority) {
        const res = await fetch(`/api/settings/task-priorities/${editingPriority.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao atualizar prioridade');
        }
        toast.success('Prioridade atualizada com sucesso');
      } else {
        const res = await fetch('/api/settings/task-priorities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao criar prioridade');
        }
        toast.success('Prioridade criada com sucesso');
      }

      setShowDialog(false);
      setEditingPriority(null);
      setFormData({ name: '', level: 2, color: '#3B82F6', icon: null, isDefault: false });
      fetchPriorities();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao salvar prioridade');
    }
  };

  const handleEdit = (priority: TaskPriority) => {
    setEditingPriority(priority);
    setFormData({
      name: priority.name,
      level: priority.level,
      color: priority.color,
      icon: priority.icon,
      isDefault: priority.isDefault,
    });
    setShowDialog(true);
  };

  const handleDelete = async (priority: TaskPriority) => {
    if (!confirm(`Tem certeza que deseja deletar a prioridade "${priority.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/task-priorities/${priority.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao deletar prioridade');
      }
      toast.success('Prioridade deletada com sucesso');
      fetchPriorities();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao deletar prioridade');
    }
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const renderPriority = (priority: TaskPriority) => (
    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
      <div
        className="h-8 w-8 rounded flex items-center justify-center"
        style={{ backgroundColor: priority.color }}
      >
        {priority.icon && getIconComponent(priority.icon)}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{priority.name}</p>
          <span className="text-xs px-2 py-0.5 bg-muted rounded">
            Nível {priority.level}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {LEVEL_LABELS[priority.level] || `Nível ${priority.level}`}
          {priority.isDefault && ' • Padrão'}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(priority);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(priority);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Prioridades de Tarefas</h3>
          <p className="text-sm text-muted-foreground">
            Defina níveis de prioridade personalizados
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Prioridade
        </Button>
      </div>

      {priorities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma prioridade customizada. Use as padrões do sistema ou crie novas.
        </div>
      ) : (
        <SortableList
          items={priorities}
          onReorder={handleReorder}
          renderItem={renderPriority}
          getId={(priority) => priority.id}
        />
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPriority ? 'Editar Prioridade' : 'Nova Prioridade'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Muito Urgente"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Nível (1-5)</label>
              <Select
                value={String(formData.level)}
                onValueChange={(value) => setFormData({ ...formData, level: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      {level} - {LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <label className="text-sm font-medium">Prioridade Padrão</label>
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
                  setEditingPriority(null);
                  setFormData({ name: '', level: 2, color: '#3B82F6', icon: null, isDefault: false });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingPriority ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
