
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/lib/i18n';
import { Building2, Users, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Department {
  id: string;
  name: string;
  templateId?: string;
  customFieldsData?: any;
  template?: any;
  _count: {
    users: number;
    teams: number;
  };
}

interface DepartmentTreeViewProps {
  departments: Department[];
  language: Language;
}

export function DepartmentTreeView({ departments, language }: DepartmentTreeViewProps) {
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const toggleDepartment = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  if (departments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {language === 'pt' ? 'Nenhum departamento criado' : 'No departments created'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'pt'
              ? 'Crie departamentos na página de Departamentos para vê-los aqui'
              : 'Create departments on the Departments page to see them here'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {language === 'pt' ? 'Hierarquia Organizacional' : 'Organizational Hierarchy'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {language === 'pt'
            ? 'Visualize a estrutura completa da empresa'
            : 'View the complete company structure'}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            {departments.map(dept => (
              <div key={dept.id}>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleDepartment(dept.id)}
                >
                  <div className="flex items-center gap-2">
                    {dept._count.teams > 0 ? (
                      expandedDepts.has(dept.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )
                    ) : (
                      <div className="w-5" />
                    )}
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dept.name}</span>
                      {dept.template && (
                        <Badge variant="outline">{dept.template.name}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {dept._count.users}{' '}
                          {language === 'pt' ? 'utilizadores' : 'users'}
                        </span>
                      </div>
                      <div>
                        {dept._count.teams}{' '}
                        {language === 'pt' ? 'equipas' : 'teams'}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {expandedDepts.has(dept.id) && dept._count.teams > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-8 mt-2 pl-4 border-l-2 border-muted"
                    >
                      <div className="text-sm text-muted-foreground p-2">
                        {language === 'pt'
                          ? `${dept._count.teams} equipas neste departamento`
                          : `${dept._count.teams} teams in this department`}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{departments.length}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'pt' ? 'Departamentos' : 'Departments'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {departments.reduce((acc, dept) => acc + dept._count.users, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'pt' ? 'Utilizadores' : 'Users'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {departments.reduce((acc, dept) => acc + dept._count.teams, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'pt' ? 'Equipas' : 'Teams'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
