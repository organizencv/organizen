'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ColorPickerSimple } from './ColorPickerSimple';
import { SortableList } from '@/components/ui/sortable-list';

interface TaskTag {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

export function TaskTagManager() {
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<TaskTag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/task-tags');
      if (!res.ok) throw new Error('Erro ao buscar tags');
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (reorderedTags: TaskTag[]) => {
    setTags(reorderedTags);

    try {
      const tagIds = reorderedTags.map((t) => t.id);
      const res = await fetch('/api/settings/task-tags/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds }),
      });
      if (!res.ok) throw new Error('Erro ao reordenar');
      toast.success('Ordem atualizada com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar nova ordem');
      fetchTags();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTag) {
        const res = await fetch(`/api/settings/task-tags/${editingTag.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao atualizar tag');
        }
        toast.success('Tag atualizada com sucesso');
      } else {
        const res = await fetch('/api/settings/task-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao criar tag');
        }
        toast.success('Tag criada com sucesso');
      }

      setShowDialog(false);
      setEditingTag(null);
      setFormData({ name: '', color: '#3B82F6', description: '' });
      fetchTags();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao salvar tag');
    }
  };

  const handleEdit = (tag: TaskTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (tag: TaskTag) => {
    if (!confirm(`Tem certeza que deseja deletar a tag "${tag.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/task-tags/${tag.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao deletar tag');
      }
      toast.success('Tag deletada com sucesso');
      fetchTags();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao deletar tag');
    }
  };

  const renderTag = (tag: TaskTag) => (
    <div className="flex items-center gap-2 p-3 bg-card border rounded-lg">
      <div
        className="h-8 w-8 rounded"
        style={{ backgroundColor: tag.color }}
      />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{tag.name}</p>
        {tag.description && (
          <p className="text-xs text-muted-foreground truncate">{tag.description}</p>
        )}
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(tag);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(tag);
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
          <h3 className="text-lg font-semibold">Tags de Tarefas</h3>
          <p className="text-sm text-muted-foreground">
            Organize suas tarefas com tags customizadas
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma tag customizada. Crie tags para organizar suas tarefas.
        </div>
      ) : (
        <SortableList
          items={tags}
          onReorder={handleReorder}
          renderItem={renderTag}
          getId={(tag) => tag.id}
        />
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Editar Tag' : 'Nova Tag'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Urgente"
                required
              />
            </div>

            <ColorPickerSimple
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
              label="Cor"
            />

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da tag..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingTag(null);
                  setFormData({ name: '', color: '#3B82F6', description: '' });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingTag ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
