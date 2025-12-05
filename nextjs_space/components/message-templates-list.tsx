'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from './ui/use-toast';
import { getTranslation, Language } from '@/lib/i18n';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  Globe,
  Lock,
} from 'lucide-react';
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

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  isPublic: boolean;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
  createdAt: string;
}

interface MessageTemplatesListProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onEditTemplate: (template: Template) => void;
  onUseTemplate: (template: Template) => void;
  templates: Template[];
  onTemplatesChange: () => void;
  language: Language;
}

export function MessageTemplatesList({
  isOpen,
  onClose,
  onCreateNew,
  onEditTemplate,
  onUseTemplate,
  templates,
  onTemplatesChange,
  language,
}: MessageTemplatesListProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState(templates);
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const filtered = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [searchTerm, templates]);

  const handleDelete = async (templateId: string) => {
    try {
      const response = await fetch(`/api/message-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      toast({
        title: language === 'pt' ? 'Sucesso' : 'Success',
        description:
          language === 'pt'
            ? 'Template eliminado'
            : 'Template deleted',
      });

      onTemplatesChange();
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setDeletingTemplate(null);
    }
  };

  const canEdit = (template: Template) => {
    if (!session?.user) return false;
    const isOwner = template.userId === session.user.id;
    const isAdmin = ['ADMIN', 'MANAGER'].includes(session.user.role || '');
    return isOwner || isAdmin;
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {getTranslation('messageTemplates', language)}
              </DialogTitle>
              <Button onClick={onCreateNew} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'pt' ? 'Novo Template' : 'New Template'}
              </Button>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  language === 'pt'
                    ? 'Pesquisar templates...'
                    : 'Search templates...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="py-4 space-y-3">
              {filteredTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                      {language === 'pt'
                        ? 'Nenhum template encontrado'
                        : 'No templates found'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === 'pt'
                        ? 'Crie um novo template para começar'
                        : 'Create a new template to get started'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold truncate">
                              {template.name}
                            </h3>
                            {template.isPublic ? (
                              <Badge
                                variant="secondary"
                                className="gap-1 flex-shrink-0"
                              >
                                <Globe className="h-3 w-3" />
                                {language === 'pt' ? 'Público' : 'Public'}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="gap-1 flex-shrink-0"
                              >
                                <Lock className="h-3 w-3" />
                                {language === 'pt' ? 'Privado' : 'Private'}
                              </Badge>
                            )}
                            <Badge variant="outline" className="flex-shrink-0">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">
                              {language === 'pt' ? 'Assunto: ' : 'Subject: '}
                            </span>
                            {template.subject}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {stripHtml(template.content)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {language === 'pt' ? 'Criado por: ' : 'Created by: '}
                            {template.user.name || template.user.email}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              onUseTemplate(template);
                              onClose();
                            }}
                            className="w-full"
                          >
                            {language === 'pt' ? 'Usar' : 'Use'}
                          </Button>
                          {canEdit(template) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  onEditTemplate(template);
                                  onClose();
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeletingTemplate(template.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={() => setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'pt'
                ? 'Eliminar Template'
                : 'Delete Template'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'pt'
                ? 'Tem certeza que deseja eliminar este template? Esta ação não pode ser desfeita.'
                : 'Are you sure you want to delete this template? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && handleDelete(deletingTemplate)}
            >
              {language === 'pt' ? 'Eliminar' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
