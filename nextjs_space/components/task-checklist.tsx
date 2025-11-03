'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CheckSquare } from 'lucide-react';

interface TaskChecklistProps {
  taskId: string;
  checkItems: any[];
  onUpdate: (task: any) => void;
  language: Language;
}

export function TaskChecklist({ taskId, checkItems, onUpdate, language }: TaskChecklistProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const completedCount = checkItems?.filter(item => item?.completed)?.length || 0;
  const totalCount = checkItems?.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/tasks/check-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newItem, taskId, order: checkItems?.length || 0 }),
      });

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Item adicionado' : 'Item added',
        });

        const taskResponse = await fetch(`/api/tasks?id=${taskId}`);
        const tasks = await taskResponse.json();
        const updatedTask = tasks.find((t: any) => t.id === taskId);
        if (updatedTask) onUpdate(updatedTask);

        setNewItem('');
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

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/tasks/check-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, completed }),
      });

      if (response.ok) {
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

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/tasks/check-items?id=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Item eliminado' : 'Item deleted',
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
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{getTranslation('checklistProgress', language)}</span>
            <span className="font-medium">{completedCount} / {totalCount} ({progress}%)</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="flex justify-end">
        {!isAdding ? (
          <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {getTranslation('addCheckItem', language)}
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Input
              placeholder={getTranslation('checkItemTitle', language)}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Button onClick={handleAddItem} disabled={loading} size="sm">
              {getTranslation('save', language)}
            </Button>
            <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
              {getTranslation('cancel', language)}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {checkItems?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
              {getTranslation('noCheckItems', language)}
            </CardContent>
          </Card>
        ) : (
          checkItems?.map((item: any) => (
            <Card key={item?.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={item?.completed}
                    onCheckedChange={(checked) => handleToggleItem(item?.id, checked as boolean)}
                  />
                  <span className={`flex-1 ${item?.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {item?.title}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteItem(item?.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
