
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { getTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Building2, FileText } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  templateId?: string | null;
  customFieldsData?: any;
  template?: {
    id: string;
    name: string;
    customFields: TemplateCustomField[];
  } | null;
}

interface TemplateCustomField {
  id: string;
  name: string;
  fieldType: string;
  isRequired: boolean;
  options?: string | null;
  displayOrder: number;
}

interface Template {
  id: string;
  name: string;
  customFields: TemplateCustomField[];
}

interface DepartmentModalProps {
  department: Department | null;
  onClose: () => void;
  onSaved: (department: any) => void;
  language: Language;
  templates: Template[];
}

export function DepartmentModal({ department, onClose, onSaved, language, templates }: DepartmentModalProps) {
  const [name, setName] = useState(department?.name || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    department?.templateId || 'no-template'
  );
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>(
    department?.customFieldsData || {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Se estiver editando e tiver um template, usar os campos do template do departamento
  // Senão, usar o template da lista de templates disponíveis
  const selectedTemplate = department?.template 
    ? department.template 
    : templates.find(t => t.id === selectedTemplateId);

  // Debug logs
  useEffect(() => {
    console.log('DepartmentModal - Debug Info:', {
      isEditing: !!department,
      departmentTemplateId: department?.templateId,
      selectedTemplateId,
      hasSelectedTemplate: !!selectedTemplate,
      selectedTemplateFieldsCount: selectedTemplate?.customFields?.length || 0,
      customFieldValues,
      templates: templates.length
    });
  }, [department, selectedTemplateId, selectedTemplate, customFieldValues, templates]);

  useEffect(() => {
    // Quando o template mudar, resetar valores de campos personalizados
    if (!department) { // Apenas em modo de criação
      setCustomFieldValues({});
    }
  }, [selectedTemplateId, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Por favor, preencha o nome do departamento' : 'Please fill in the department name',
        variant: 'destructive',
      });
      return;
    }

    // Validar campos obrigatórios
    if (selectedTemplate && selectedTemplate.customFields) {
      for (const field of selectedTemplate.customFields) {
        if (field.isRequired && !customFieldValues[field.id]) {
          toast({
            title: language === 'pt' ? 'Erro' : 'Error',
            description: language === 'pt' 
              ? `Por favor, preencha o campo obrigatório: ${field.name}` 
              : `Please fill in the required field: ${field.name}`,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      const url = department 
        ? `/api/departments/${department.id}` 
        : '/api/departments';
      
      const method = department ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          templateId: selectedTemplateId === 'no-template' ? null : selectedTemplateId,
          customFields: customFieldValues
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save department');
      }

      const savedDepartment = await response.json();
      
      toast({
        title: language === 'pt' 
          ? (department ? 'Departamento atualizado' : 'Departamento criado') 
          : (department ? 'Department updated' : 'Department created'),
        description: language === 'pt' 
          ? (department ? 'Departamento atualizado com sucesso' : 'Departamento criado com sucesso') 
          : (department ? 'Department updated successfully' : 'Department created successfully'),
      });

      onSaved(savedDepartment);
      onClose();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' 
          ? 'Erro ao guardar departamento' 
          : 'Failed to save department',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCustomField = (field: TemplateCustomField) => {
    const value = customFieldValues[field.id];

    switch (field.fieldType.toUpperCase()) {
      case 'TEXT':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value || ''}
              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
              disabled={isLoading}
              required={field.isRequired}
            />
          </div>
        );

      case 'NUMBER':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={value || ''}
              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
              disabled={isLoading}
              required={field.isRequired}
            />
          </div>
        );

      case 'DATE':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value || ''}
              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
              disabled={isLoading}
              required={field.isRequired}
            />
          </div>
        );

      case 'TEXTAREA':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value || ''}
              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
              disabled={isLoading}
              required={field.isRequired}
              rows={3}
            />
          </div>
        );

      case 'CHECKBOX':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => setCustomFieldValues({ ...customFieldValues, [field.id]: checked })}
              disabled={isLoading}
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.name}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case 'SELECT':
        // Parse options - pode ser string separada por vírgula ou JSON
        let options: string[] = [];
        if (field.options) {
          try {
            // Tentar parsear como JSON primeiro
            const parsed = JSON.parse(field.options);
            if (Array.isArray(parsed)) {
              options = parsed;
            } else {
              options = field.options.split(',').map(o => o.trim()).filter(o => o);
            }
          } catch {
            // Se não for JSON, tratar como string separada por vírgula
            options = field.options.split(',').map(o => o.trim()).filter(o => o);
          }
        }
        
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value || 'placeholder'}
              onValueChange={(val) => {
                if (val !== 'placeholder') {
                  setCustomFieldValues({ ...customFieldValues, [field.id]: val });
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger id={field.id}>
                <SelectValue placeholder={language === 'pt' ? 'Selecionar...' : 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>
                  {language === 'pt' ? 'Selecionar...' : 'Select...'}
                </SelectItem>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {department 
              ? getTranslation('editDepartment', language) 
              : getTranslation('newDepartment', language)
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'pt' ? 'Nome do Departamento' : 'Department Name'}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'pt' ? 'Ex: Recursos Humanos' : 'E.g.: Human Resources'}
              disabled={isLoading}
              required
            />
          </div>

          {/* Template Selection */}
          {!department && templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template">
                <FileText className="inline h-4 w-4 mr-1" />
                {language === 'pt' ? 'Template (Opcional)' : 'Template (Optional)'}
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={isLoading}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder={language === 'pt' ? 'Selecionar template...' : 'Select template...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-template">
                    {language === 'pt' ? 'Sem template' : 'No template'}
                  </SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Fields */}
          {selectedTemplate && selectedTemplate.customFields && selectedTemplate.customFields.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                {language === 'pt' ? 'Campos Personalizados' : 'Custom Fields'}
                <Badge variant="outline" className="ml-auto">
                  {selectedTemplate.customFields.length} {language === 'pt' ? 'campos' : 'fields'}
                </Badge>
              </div>
              {selectedTemplate.customFields.map(field => renderCustomField(field))}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {getTranslation('cancel', language)}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (language === 'pt' ? 'A guardar...' : 'Saving...') 
                : getTranslation('save', language)
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
