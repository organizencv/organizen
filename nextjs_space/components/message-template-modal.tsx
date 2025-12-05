'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getTranslation, Language } from '@/lib/i18n';
import { RichTextEditor } from './rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

interface MessageTemplate {
  id?: string;
  name: string;
  subject: string;
  content: string;
  category?: string;
  isPublic: boolean;
}

interface MessageTemplateModalProps {
  template?: MessageTemplate;
  onClose: () => void;
  onSaved: (template: MessageTemplate) => void;
  language: Language;
}

export function MessageTemplateModal({ template, onClose, onSaved, language }: MessageTemplateModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MessageTemplate>({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    category: template?.category || 'general',
    isPublic: template?.isPublic || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('📋 TEMPLATE SUBMIT - Dados:', formData);

    if (!formData.name || !formData.subject || !formData.content) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Preencha todos os campos obrigatórios' : 'Fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const url = template?.id ? `/api/message-templates/${template.id}` : '/api/message-templates';
      const method = template?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('📥 TEMPLATE - Resposta:', response.status, response.ok);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      const savedTemplate = await response.json();
      console.log('✅ TEMPLATE - Salvo:', savedTemplate);
      
      onSaved(savedTemplate);

      toast({
        title: language === 'pt' ? 'Sucesso' : 'Success',
        description: template?.id
          ? (language === 'pt' ? 'Template atualizado' : 'Template updated')
          : (language === 'pt' ? 'Template criado' : 'Template created'),
      });

      onClose();
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'general', label: language === 'pt' ? 'Geral' : 'General' },
    { value: 'welcome', label: language === 'pt' ? 'Boas-vindas' : 'Welcome' },
    { value: 'announcement', label: language === 'pt' ? 'Anúncio' : 'Announcement' },
    { value: 'reminder', label: language === 'pt' ? 'Lembrete' : 'Reminder' },
    { value: 'report', label: language === 'pt' ? 'Relatório' : 'Report' },
    { value: 'other', label: language === 'pt' ? 'Outro' : 'Other' },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <DialogTitle>
              {template?.id
                ? (language === 'pt' ? 'Editar Template' : 'Edit Template')
                : (language === 'pt' ? 'Novo Template' : 'New Template')}
            </DialogTitle>
          </div>
          <DialogDescription>
            {language === 'pt'
              ? 'Crie templates reutilizáveis para suas mensagens'
              : 'Create reusable templates for your messages'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Template */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {getTranslation('templateName', language)} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'pt' ? 'Nome do template' : 'Template name'}
              required
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">
              {getTranslation('templateCategory', language)}
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              {language === 'pt' ? 'Assunto' : 'Subject'} *
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder={language === 'pt' ? 'Assunto da mensagem' : 'Message subject'}
              required
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label>
              {language === 'pt' ? 'Conteúdo' : 'Content'} *
            </Label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              language={language}
              placeholder={language === 'pt' ? 'Escreva o conteúdo...' : 'Write content...'}
              minHeight="200px"
            />
          </div>

          {/* Template Público */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>
                {getTranslation('publicTemplate', language)}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'pt'
                  ? 'Permitir que todos os usuários usem este template'
                  : 'Allow all users to use this template'}
              </p>
            </div>
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                language === 'pt' ? 'Guardando...' : 'Saving...'
              ) : (
                language === 'pt' ? 'Guardar' : 'Save'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
