
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Language } from '@/lib/i18n';
import { Plus, Edit, Trash2, FileText, Save, Settings2 } from 'lucide-react';

interface TemplateCustomField {
  id: string;
  name: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
}

interface DepartmentCustomField {
  id: string;
  fieldName: string;
  fieldType: string;
  fieldOptions?: any;
  isRequired: boolean;
  order: number;
}

interface DepartmentTemplate {
  id: string;
  name: string;
  description?: string;
  defaultManagerRole?: string;
  customFields?: TemplateCustomField[];
  _count: {
    departments: number;
  };
}

interface DepartmentTemplateManagerProps {
  templates: DepartmentTemplate[];
  availableFields: DepartmentCustomField[]; // Campos globais disponíveis
  onChange: (templates: DepartmentTemplate[]) => void;
  language: Language;
}

export function DepartmentTemplateManager({
  templates,
  availableFields,
  onChange,
  language
}: DepartmentTemplateManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DepartmentTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultManagerRole: 'MANAGER',
    selectedFieldIds: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      defaultManagerRole: 'MANAGER',
      selectedFieldIds: []
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: DepartmentTemplate) => {
    setEditingTemplate(template);
    
    // Mapear os campos do template de volta para os IDs dos campos globais
    // através do nome do campo
    const selectedIds = template.customFields
      ?.map(tf => availableFields.find(af => af.fieldName === tf.name)?.id)
      .filter(Boolean) as string[] || [];
    
    setFormData({
      name: template.name,
      description: template.description || '',
      defaultManagerRole: template.defaultManagerRole || 'MANAGER',
      selectedFieldIds: selectedIds
    });
    setIsDialogOpen(true);
  };

  const handleToggleField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFieldIds: prev.selectedFieldIds.includes(fieldId)
        ? prev.selectedFieldIds.filter(id => id !== fieldId)
        : [...prev.selectedFieldIds, fieldId]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Nome é obrigatório' : 'Name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const url = editingTemplate
        ? `/api/settings/departments/templates/${editingTemplate.id}`
        : '/api/settings/departments/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      // Enviar os IDs dos campos selecionados
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          defaultManagerRole: formData.defaultManagerRole,
          fieldIds: formData.selectedFieldIds
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      const savedTemplate = await response.json();

      if (editingTemplate) {
        onChange(templates.map(t => (t.id === savedTemplate.id ? savedTemplate : t)));
      } else {
        onChange([...templates, savedTemplate]);
      }

      toast({
        title: language === 'pt' ? 'Sucesso' : 'Success',
        description:
          language === 'pt'
            ? `Template ${editingTemplate ? 'atualizado' : 'criado'} com sucesso`
            : `Template ${editingTemplate ? 'updated' : 'created'} successfully`
      });

      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error.message || (language === 'pt' ? 'Erro ao salvar template' : 'Failed to save template'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (template: DepartmentTemplate) => {
    if (template._count.departments > 0) {
      toast({
        title: language === 'pt' ? 'Não é possível deletar' : 'Cannot delete',
        description:
          language === 'pt'
            ? 'Este template está em uso por departamentos'
            : 'This template is in use by departments',
        variant: 'destructive'
      });
      return;
    }

    if (
      !confirm(
        language === 'pt'
          ? `Tem certeza que deseja deletar o template "${template.name}"?`
          : `Are you sure you want to delete the template "${template.name}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/departments/templates/${template.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete template');
      }

      onChange(templates.filter(t => t.id !== template.id));

      toast({
        title: language === 'pt' ? 'Sucesso' : 'Success',
        description: language === 'pt' ? 'Template deletado com sucesso' : 'Template deleted successfully'
      });
    } catch (error: any) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error.message || (language === 'pt' ? 'Erro ao deletar template' : 'Failed to delete template'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {language === 'pt' ? 'Templates de Departamentos' : 'Department Templates'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'pt'
              ? 'Crie templates padrão para agilizar a criação de novos departamentos'
              : 'Create standard templates to streamline department creation'}
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {language === 'pt' ? 'Novo Template' : 'New Template'}
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'pt' ? 'Nenhum template criado' : 'No templates created'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'pt'
                ? 'Crie o primeiro template para começar'
                : 'Create the first template to get started'}
            </p>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              {language === 'pt' ? 'Criar Template' : 'Create Template'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {template.name}
                  </span>
                </CardTitle>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {template.defaultManagerRole && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.defaultManagerRole}</Badge>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <div>
                      {template._count.departments}{' '}
                      {language === 'pt' ? 'departamento(s)' : 'department(s)'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings2 className="h-3 w-3" />
                      {template.customFields?.length || 0}{' '}
                      {language === 'pt' ? 'campo(s)' : 'field(s)'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {language === 'pt' ? 'Editar' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    className="flex-1 gap-2 text-destructive hover:text-destructive"
                    disabled={template._count.departments > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    {language === 'pt' ? 'Deletar' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? language === 'pt'
                  ? 'Editar Template'
                  : 'Edit Template'
                : language === 'pt'
                ? 'Novo Template'
                : 'New Template'}
            </DialogTitle>
            <DialogDescription>
              {language === 'pt'
                ? 'Defina as configurações padrão para este template de departamento'
                : 'Define the default settings for this department template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{language === 'pt' ? 'Nome' : 'Name'}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === 'pt' ? 'Ex: Departamento de TI' : 'e.g., IT Department'}
              />
            </div>

            <div>
              <Label htmlFor="description">{language === 'pt' ? 'Descrição' : 'Description'}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'pt' ? 'Descrição opcional...' : 'Optional description...'}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="defaultManagerRole">
                {language === 'pt' ? 'Role Padrão do Manager' : 'Default Manager Role'}
              </Label>
              <Select
                value={formData.defaultManagerRole}
                onValueChange={value => setFormData({ ...formData, defaultManagerRole: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="MANAGER">MANAGER</SelectItem>
                  <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Campos Customizados */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <Label className="text-base">
                  {language === 'pt' ? 'Campos Customizados' : 'Custom Fields'}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'pt'
                  ? 'Selecione os campos que farão parte deste template'
                  : 'Select the fields that will be part of this template'}
              </p>

              {availableFields.length === 0 ? (
                <div className="p-4 border rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
                  {language === 'pt'
                    ? 'Nenhum campo customizado disponível. Crie campos na seção acima primeiro.'
                    : 'No custom fields available. Create fields in the section above first.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {availableFields.map(field => (
                    <div
                      key={field.id}
                      className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded transition-colors"
                    >
                      <Checkbox
                        id={`field-${field.id}`}
                        checked={formData.selectedFieldIds.includes(field.id)}
                        onCheckedChange={() => handleToggleField(field.id)}
                      />
                      <Label
                        htmlFor={`field-${field.id}`}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <span className="font-medium">{field.fieldName}</span>
                        <Badge variant="outline" className="text-xs">
                          {field.fieldType}
                        </Badge>
                        {field.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            {language === 'pt' ? 'Obrigatório' : 'Required'}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {formData.selectedFieldIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {formData.selectedFieldIds.length}{' '}
                  {language === 'pt' 
                    ? `campo${formData.selectedFieldIds.length > 1 ? 's' : ''} selecionado${formData.selectedFieldIds.length > 1 ? 's' : ''}`
                    : `field${formData.selectedFieldIds.length > 1 ? 's' : ''} selected`}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {language === 'pt' ? 'Salvar' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
