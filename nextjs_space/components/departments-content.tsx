
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { DepartmentModal } from './department-modal';
import { SortableList } from './ui/sortable-list';
import { getTranslation, Language } from '@/lib/i18n';
import { Plus, Search, Building2, Edit, Trash2, Users } from 'lucide-react';
import { BackButton } from './back-button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Department {
  id: string;
  name: string;
  templateId?: string | null;
  customFieldsData?: any;
  template?: {
    id: string;
    name: string;
    customFields: any[];
  } | null;
  _count: {
    users: number;
    teams: number;
  };
}

interface Template {
  id: string;
  name: string;
  customFields: any[];
}

interface DepartmentsContentProps {
  departments: Department[];
  userRole: string;
  templates: Template[];
}

export function DepartmentsContent({ departments: initialDepartments, userRole, templates }: DepartmentsContentProps) {
  const { data: session } = useSession();
  const [language, setLanguage] = useState<Language>('pt');
  const [departments, setDepartments] = useState(initialDepartments);
  const [filteredDepartments, setFilteredDepartments] = useState(initialDepartments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Primeiro tenta ler do localStorage (persistência local)
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      // Fallback para a sessão se não houver no localStorage
      const sessionLang = session.user.language as Language;
      setLanguage(sessionLang);
      localStorage.setItem('userLanguage', sessionLang);
    }
  }, [session]);

  useEffect(() => {
    const filtered = departments.filter(dept =>
      dept?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
    );
    setFilteredDepartments(filtered);
  }, [departments, searchTerm]);

  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    
    if (dept && dept._count.users > 0) {
      toast({
        title: language === 'pt' ? 'Não é possível eliminar' : 'Cannot delete',
        description: language === 'pt' 
          ? 'Este departamento tem utilizadores atribuídos. Por favor, remova-os primeiro.' 
          : 'This department has assigned users. Please remove them first.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(getTranslation('delete', language) + '?')) return;

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDepartments(departments.filter(dept => dept?.id !== departmentId));
        toast({
          title: language === 'pt' ? 'Departamento eliminado' : 'Department deleted',
          description: language === 'pt' ? 'Departamento eliminado com sucesso' : 'Department deleted successfully',
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete department');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao eliminar departamento' : 'Failed to delete department',
        variant: 'destructive',
      });
    }
  };

  const handleDepartmentSaved = (savedDepartment: any) => {
    if (editingDepartment) {
      setDepartments(departments.map(dept => dept?.id === savedDepartment.id ? savedDepartment : dept));
    } else {
      setDepartments([savedDepartment, ...departments]);
    }
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const handleReorder = async (reorderedDepartments: Department[]) => {
    // Optimistic update
    setFilteredDepartments(reorderedDepartments);
    setDepartments(reorderedDepartments);

    try {
      const orderedIds = reorderedDepartments.map((dept) => dept.id);
      const response = await fetch('/api/departments/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder departments');
      }

      toast({
        title: language === 'pt' ? 'Ordem atualizada' : 'Order updated',
        description: language === 'pt' ? 'A ordem dos departamentos foi atualizada' : 'Departments order has been updated',
      });
    } catch (error) {
      // Revert on error
      setFilteredDepartments(filteredDepartments);
      setDepartments(departments);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao reordenar departamentos' : 'Failed to reorder departments',
        variant: 'destructive',
      });
    }
  };

  const renderDepartment = (department: Department) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {department?.name}
                </h3>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{department?._count?.users || 0} {language === 'pt' ? 'utilizadores' : 'users'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {department?._count?.teams || 0} {language === 'pt' ? 'equipas' : 'teams'}
                </Badge>
              </div>
            </div>
            {department?.template && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Template: {department.template.name}
                </Badge>
                {department.template.customFields?.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {department.template.customFields.length} {language === 'pt' ? 'campos' : 'fields'}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditDepartment(department)}
              className="flex-1 gap-2"
            >
              <Edit className="h-4 w-4" />
              {getTranslation('edit', language)}
            </Button>
            {userRole === 'ADMIN' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteDepartment(department?.id)}
                className="flex-1 gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {getTranslation('delete', language)}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackRoute="/dashboard" variant="ghost" />
          </div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            {getTranslation('departments', language)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'pt' ? 'Gerir departamentos da empresa' : 'Manage company departments'}
          </p>
        </div>
        <Button onClick={handleCreateDepartment} className="gap-2">
          <Plus className="h-4 w-4" />
          {getTranslation('newDepartment', language)}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'pt' ? 'Pesquisar departamentos...' : 'Search departments...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid gap-4">
        {filteredDepartments?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {language === 'pt' ? 'Nenhum departamento encontrado' : 'No departments found'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'pt' ? 'Adicione o primeiro departamento' : 'Add the first department'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <SortableList
            items={filteredDepartments}
            onReorder={handleReorder}
            renderItem={renderDepartment}
            getId={(dept) => dept.id}
          />
        )}
      </div>

      {/* Department Modal */}
      {isModalOpen && (
        <DepartmentModal
          department={editingDepartment}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDepartment(null);
          }}
          onSaved={handleDepartmentSaved}
          language={language}
          templates={templates}
        />
      )}
    </div>
  );
    }
