'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface TaskCommentsProps {
  taskId: string;
  task?: any;
  comments: any[];
  currentUserId: string;
  currentUserRole?: string;
  onUpdate: (task: any) => void;
  language: Language;
}

export function TaskComments({ taskId, task, comments, currentUserId, currentUserRole, onUpdate, language }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const isTaskCompleted = task?.status === 'COMPLETED';

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

  const canDeleteComment = (comment: any) => {
    // Pode deletar se for o autor OU se for admin
    const isAuthor = comment?.userId === currentUserId;
    const isAdmin = currentUserRole === 'ADMIN';
    return isAuthor || isAdmin;
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const response = await fetch(`/api/tasks/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: getTranslation('commentDeleted', language),
        });

        // Atualizar tarefa
        const taskResponse = await fetch(`/api/tasks?id=${taskId}`);
        const tasks = await taskResponse.json();
        const updatedTask = tasks.find((t: any) => t.id === taskId);
        if (updatedTask) onUpdate(updatedTask);
      } else {
        const errorData = await response.json();
        toast({
          title: language === 'pt' ? 'Erro' : 'Error',
          description: errorData.error || (language === 'pt' ? 'Erro ao eliminar comentário' : 'Error deleting comment'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao eliminar comentário' : 'Error deleting comment',
        variant: 'destructive',
      });
    } finally {
      setDeletingCommentId(null);
      setShowDeleteDialog(false);
      setCommentToDelete(null);
    }
  };

  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder={getTranslation('writeComment', language)}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          disabled={isTaskCompleted}
        />
        <div className="space-y-2">
          <div className="flex justify-end">
            <Button 
              onClick={handleAddComment} 
              disabled={loading || isTaskCompleted} 
              size="sm" 
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {getTranslation('addComment', language)}
            </Button>
          </div>
          {isTaskCompleted && (
            <p className="text-xs text-muted-foreground text-right">
              {language === 'pt' 
                ? 'Não é possível adicionar comentários a uma tarefa concluída' 
                : 'Cannot add comments to a completed task'}
            </p>
          )}
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
                      {getInitials(comment?.user?.name || comment?.user?.email || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment?.user?.name || comment?.user?.email || (language === 'pt' ? 'Utilizador' : 'User')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment?.createdAt), {
                            addSuffix: true,
                            locale: language === 'pt' ? pt : enUS
                          })}
                        </span>
                      </div>
                      {canDeleteComment(comment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          {deletingCommentId === comment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
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

      {/* Dialog de confirmação de eliminação */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'pt' ? 'Eliminar Comentário' : 'Delete Comment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'pt' 
                ? 'Tem certeza que deseja eliminar este comentário? Esta ação não pode ser desfeita.'
                : 'Are you sure you want to delete this comment? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => commentToDelete && handleDeleteComment(commentToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {language === 'pt' ? 'Eliminar' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
