'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';

interface TaskCommentsProps {
  taskId: string;
  comments: any[];
  currentUserId: string;
  onUpdate: (task: any) => void;
  language: Language;
}

export function TaskComments({ taskId, comments, currentUserId, onUpdate, language }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/tasks/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, taskId }),
      });

      if (response.ok) {
        toast({
          title: getTranslation('commentAdded', language),
        });

        const taskResponse = await fetch(`/api/tasks?id=${taskId}`);
        const tasks = await taskResponse.json();
        const updatedTask = tasks.find((t: any) => t.id === taskId);
        if (updatedTask) onUpdate(updatedTask);

        setNewComment('');
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder={getTranslation('writeComment', language)}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button onClick={handleAddComment} disabled={loading} size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            {getTranslation('addComment', language)}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {comments?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              {getTranslation('noComments', language)}
            </CardContent>
          </Card>
        ) : (
          comments?.map((comment: any) => (
            <Card key={comment?.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(comment?.userId || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment?.userId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment?.createdAt), {
                          addSuffix: true,
                          locale: language === 'pt' ? pt : enUS
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment?.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
