
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getTranslation, Language } from '@/lib/i18n';
import { Building2, FileText, Settings2, LayoutList } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { DepartmentTemplateManager } from './DepartmentTemplateManager';
import { DepartmentCustomFieldManager } from './DepartmentCustomFieldManager';
import { DepartmentTreeView } from './DepartmentTreeView';

interface DepartmentTemplate {
  id: string;
  name: string;
  description?: string;
  defaultManagerRole?: string;
  customFields?: any;
  _count: {
    departments: number;
  };
}

interface DepartmentCustomField {
  id: string;
  fieldName: string;
  fieldType: string;
  fieldOptions?: any;
  isRequired: boolean;
  order: number;
}

interface Department {
  id: string;
  name: string;
  templateId?: string;
  customFieldsData?: any;
  template?: DepartmentTemplate;
  _count: {
    users: number;
    teams: number;
  };
}

interface DepartmentStructureSettingsProps {
  initialTemplates: DepartmentTemplate[];
  initialCustomFields: DepartmentCustomField[];
  initialDepartments: Department[];
}

export function DepartmentStructureSettings({
  initialTemplates,
  initialCustomFields,
  initialDepartments
}: DepartmentStructureSettingsProps) {
  const { data: session } = useSession();
  const [language, setLanguage] = useState<Language>('pt');
  const [templates, setTemplates] = useState(initialTemplates);
  const [customFields, setCustomFields] = useState(initialCustomFields);
  const [departments, setDepartments] = useState(initialDepartments);
  const { toast } = useToast();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      const sessionLang = session.user.language as Language;
      setLanguage(sessionLang);
      localStorage.setItem('userLanguage', sessionLang);
    }
  }, [session]);

  const handleTemplatesChange = (newTemplates: DepartmentTemplate[]) => {
    setTemplates(newTemplates);
  };

  const handleCustomFieldsChange = (newCustomFields: DepartmentCustomField[]) => {
    setCustomFields(newCustomFields);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          {language === 'pt' ? 'Estrutura Organizacional' : 'Organizational Structure'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {language === 'pt'
            ? 'Gerir templates de departamentos, campos customizados e visualizar a hierarquia da empresa'
            : 'Manage department templates, custom fields and view company hierarchy'}
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            {language === 'pt' ? 'Templates' : 'Templates'}
          </TabsTrigger>
          <TabsTrigger value="custom-fields" className="gap-2">
            <Settings2 className="h-4 w-4" />
            {language === 'pt' ? 'Campos Customizados' : 'Custom Fields'}
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2">
            <LayoutList className="h-4 w-4" />
            {language === 'pt' ? 'Hierarquia' : 'Hierarchy'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <DepartmentTemplateManager
            templates={templates}
            availableFields={customFields}
            onChange={handleTemplatesChange}
            language={language}
          />
        </TabsContent>

        <TabsContent value="custom-fields">
          <DepartmentCustomFieldManager
            customFields={customFields}
            onChange={handleCustomFieldsChange}
            language={language}
          />
        </TabsContent>

        <TabsContent value="hierarchy">
          <DepartmentTreeView
            departments={departments}
            language={language}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
