'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Tag } from 'lucide-react';

interface TaskTagsProps {
  taskId: string;
  task?: any;
  tags: any[];
  onUpdate: (task: any) => void;
  language: Language;
}

const PRESET_COLORS = [
  // Reds & Pinks
  { name: 'Rose', value: '#FF6B9D' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Dark Red', value: '#DC2626' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Hot Pink', value: '#FF1493' },
  
  // Oranges & Yellows
  { name: 'Orange', value: '#F97316' },
  { name: 'Dark Orange', value: '#EA580C' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Gold', value: '#FFA500' },
  
  // Greens
  { name: 'Lime', value: '#84CC16' },
  { name: 'Green', value: '#10B981' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Dark Green', value: '#047857' },
  
  // Blues
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Sky Blue', value: '#0EA5E9' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Dark Blue', value: '#2563EB' },
  { name: 'Indigo', value: '#6366F1' },
  
  // Purples
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Magenta', value: '#C026D3' },
  
  // Neutrals
  { name: 'Gray', value: '#6B7280' },
  { name: 'Slate', value: '#64748B' },
  { name: 'Zinc', value: '#71717A' },
  { name: 'Stone', value: '#78716C' },
  
  // Browns
  { name: 'Brown', value: '#92400E' },
  { name: 'Coffee', value: '#78350F' },
];

export function TaskTags({ taskId, task, tags, onUpdate, language }: TaskTagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isTaskCompleted = task?.status === 'COMPLETED';

  const handleAddTag = async () => {
    if (!newTag.name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/tasks/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTag.name, color: newTag.color, taskId }),
      });

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Etiqueta adicionada' : 'Tag added',
        });

        const taskResponse = await fetch(`/api/tasks?id=${taskId}`);
        const tasks = await taskResponse.json();
        const updatedTask = tasks.find((t: any) => t.id === taskId);
        if (updatedTask) onUpdate(updatedTask);

        setNewTag({ name: '', color: '#3B82F6' });
        setIsAdding(false);
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

  const handleDeleteTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tasks/tags?id=${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Etiqueta removida' : 'Tag removed',
        });

        const taskResponse = await fetch(`/api/tasks?id=${taskId}`);
        const tasks = await taskResponse.json();
        const updatedTask = tasks.find((t: any) => t.id === taskId);
        if (updatedTask) onUpdate(updatedTask);
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
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
              {getTranslation('addTag', language)}
            </Button>
          ) : (
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Input
                  placeholder={getTranslation('tagName', language)}
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                />
                <div>
                  <p className="text-sm font-medium mb-2">{getTranslation('tagColor', language)}</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newTag.color === color.value ? 'border-gray-900 scale-110' : 'border-border'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewTag({ ...newTag, color: color.value })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
                    {getTranslation('cancel', language)}
                  </Button>
                  <Button onClick={handleAddTag} disabled={loading} size="sm">
                    {getTranslation('save', language)}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
        {isTaskCompleted && (
          <p className="text-xs text-muted-foreground text-right">
            {language === 'pt' 
              ? 'Não é possível modificar etiquetas numa tarefa concluída' 
              : 'Cannot modify tags in a completed task'}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags?.length === 0 ? (
          <Card className="w-full">
            <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Tag className="h-8 w-8 text-muted-foreground" />
              {getTranslation('noTags', language)}
            </CardContent>
          </Card>
        ) : (
          tags?.map((tag: any) => (
            <Badge
              key={tag?.id}
              className="flex items-center gap-2 px-3 py-1.5 text-sm"
              style={{ backgroundColor: tag?.color, color: '#ffffff' }}
            >
              {tag?.name}
              {!isTaskCompleted && (
                <button
                  onClick={() => handleDeleteTag(tag?.id)}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
