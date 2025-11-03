
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SortableList } from '@/components/ui/sortable-list';
import { useToast } from '@/hooks/use-toast';
import { Language } from '@/lib/i18n';
import { Plus, Edit, Trash2, GripVertical, Settings2, Save } from 'lucide-react';

interface DepartmentCustomField {
  id: string;
  fieldName: string;
  fieldType: string;
  fieldOptions?: any;
  isRequired: boolean;
  order: number;
}

interface DepartmentCustomFieldManagerProps {
  customFields: DepartmentCustomField[];
  onChange: (customFields: DepartmentCustomField[]) => void;
  language: Language;
}

export function DepartmentCustomFieldManager({
  customFields,
  onChange,
  language
}: DepartmentCustomFieldManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<DepartmentCustomField | null>(null);
  const [formData, setFormData] = useState({
    fieldName: '',
    fieldType: 'text',
    fieldOptions: [] as string[],
    isRequired: false
  });
  const [optionInput, setOptionInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fieldTypes = [
    { value: 'text', label: language === 'pt' ? 'Texto' : 'Text' },
    { value: 'number', label: language === 'pt' ? 'Número' : 'Number' },
    { value: 'date', label: language === 'pt' ? 'Data' : 'Date' },
    { value: 'select', label: language === 'pt' ? 'Seleção' : 'Select' },
    { value: 'checkbox', label: language === 'pt' ? 'Checkbox' : 'Checkbox' }
  ];

  const handleCreate = () => {
    setEditingField(null);
    setFormData({
      fieldName: '',
      fieldType: 'text',
      fieldOptions: [],
      isRequired: false
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (field: DepartmentCustomField) => {
    setEditingField(field);
    setFormData({
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      fieldOptions: field.fieldOptions || [],
      isRequired: field.isRequired
    });
    setIsDialogOpen(true);
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setFormData({
        ...formData,
        fieldOptions: [...formData.fieldOptions, optionInput.trim()]
      });
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      fieldOptions: formData.fieldOptions.filter((_: any, i: number) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!formData.fieldName.trim()) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Nome do campo é obrigatório' : 'Field name is required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.fieldType === 'select' && formData.fieldOptions.length === 0) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description:
          language === 'pt'
            ? 'Campos de seleção precisam de pelo menos uma opção'
            : 'Select fields need at least one option',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const url = editingField
        ? `/api/settings/departments/custom-fields/${editingField.id}`
        : '/api/settings/departments/custom-fields';
      const method = editingField ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          order: editingField ? editingField.order : customFields.length
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save custom field');
      }

      const savedField = await response.json();

      if (editingField) {
        onChange(customFields.map(f => (f.id === savedField.id ? savedField : f)));
      } else {
        onChange([...customFields, savedField]);
      }

      toast({
        title: language === 'pt' ? 'Sucesso' : 'Success',
        description:
          language === 'pt'
            ? `Campo ${editingField ? 'atualizado' : 'criado'} com sucesso`
            : `Field ${editingField ? 'updated' : 'created'} successfully`
      });

      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error.message || (language === 'pt' ? 'Erro ao salvar campo' : 'Failed to save field'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (field: DepartmentCustomField) => {
    if (
      !confirm(
        language === 'pt'
          ? `Tem certeza que deseja deletar o campo "${field.fieldName}"?`
          : `Are you sure you want to delete the field "${field.fieldName}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/departments/custom-fields/${field.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete custom field');
      }

      onChange(customFields.filter(f => f.id !== field.id));

      toast({
        title: language === 'pt' ? 'Sucesso' : 'Success',
        description: language === 'pt' ? 'Campo deletado com sucesso' : 'Field deleted successfully'
      });
    } catch (error: any) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error.message || (language === 'pt' ? 'Erro ao deletar campo' : 'Failed to delete field'),
        variant: 'destructive'
      });
    }
  };

  const handleReorder = async (reorderedFields: DepartmentCustomField[]) => {
    // Atualizar ordem local
    const updatedFields = reorderedFields.map((f, index) => ({ ...f, order: index }));
    onChange(updatedFields);

    // Salvar a nova ordem no backend
    try {
      const fieldIds = reorderedFields.map((f) => f.id);
      const response = await fetch('/api/settings/departments/custom-fields/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldIds })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder fields');
      }

      toast({
        title: language === 'pt' ? 'Sucesso' : 'Success',
        description: language === 'pt' ? 'Ordem atualizada' : 'Order updated'
      });
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao atualizar ordem' : 'Failed to update order',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {language === 'pt' ? 'Campos Customizados' : 'Custom Fields'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'pt'
              ? 'Adicione campos extras aos seus departamentos'
              : 'Add extra fields to your departments'}
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {language === 'pt' ? 'Novo Campo' : 'New Field'}
        </Button>
      </div>

      {customFields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'pt' ? 'Nenhum campo customizado' : 'No custom fields'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'pt'
                ? 'Crie campos customizados para adaptar departamentos às suas necessidades'
                : 'Create custom fields to adapt departments to your needs'}
            </p>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              {language === 'pt' ? 'Criar Campo' : 'Create Field'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <SortableList
              items={customFields}
              onReorder={handleReorder}
              renderItem={(field) => (
                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.fieldName}</span>
                      <Badge variant="outline">{field.fieldType}</Badge>
                      {field.isRequired && (
                        <Badge variant="destructive">
                          {language === 'pt' ? 'Obrigatório' : 'Required'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(field);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(field);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              getId={(field) => field.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar/editar campo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingField
                ? language === 'pt'
                  ? 'Editar Campo'
                  : 'Edit Field'
                : language === 'pt'
                ? 'Novo Campo'
                : 'New Field'}
            </DialogTitle>
            <DialogDescription>
              {language === 'pt'
                ? 'Configure o campo customizado para os departamentos'
                : 'Configure the custom field for departments'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fieldName">{language === 'pt' ? 'Nome do Campo' : 'Field Name'}</Label>
              <Input
                id="fieldName"
                value={formData.fieldName}
                onChange={e => setFormData({ ...formData, fieldName: e.target.value })}
                placeholder={language === 'pt' ? 'Ex: Orçamento Anual' : 'e.g., Annual Budget'}
              />
            </div>

            <div>
              <Label htmlFor="fieldType">{language === 'pt' ? 'Tipo do Campo' : 'Field Type'}</Label>
              <Select
                value={formData.fieldType}
                onValueChange={value => setFormData({ ...formData, fieldType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.fieldType === 'select' && (
              <div>
                <Label>{language === 'pt' ? 'Opções de Seleção' : 'Select Options'}</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={optionInput}
                    onChange={e => setOptionInput(e.target.value)}
                    placeholder={language === 'pt' ? 'Adicionar opção...' : 'Add option...'}
                    onKeyPress={e => e.key === 'Enter' && handleAddOption()}
                  />
                  <Button type="button" onClick={handleAddOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.fieldOptions.map((option: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1">{option}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="isRequired"
                checked={formData.isRequired}
                onCheckedChange={checked => setFormData({ ...formData, isRequired: checked })}
              />
              <Label htmlFor="isRequired">
                {language === 'pt' ? 'Campo obrigatório' : 'Required field'}
              </Label>
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
