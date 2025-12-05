
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Language } from '@/lib/i18n';
import { Building2, Users, Briefcase, X, Loader2, Mail } from 'lucide-react';
import { Separator } from './ui/separator';
import { UserDetailsModal } from './user-details-modal';
import { TeamDetailsModal } from './team-details-modal';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
}

interface CustomField {
  id: string;
  fieldName: string;
  fieldType: string;
  displayOrder: number;
}

interface Template {
  id: string;
  name: string;
  customFields: CustomField[];
}

interface DepartmentDetails {
  id: string;
  name: string;
  templateId?: string | null;
  customFieldsData?: any;
  template?: Template | null;
  teams: Team[];
  users: User[];
  _count: {
    users: number;
    teams: number;
  };
}

interface DepartmentDetailsModalProps {
  departmentId: string;
  onClose: () => void;
  language: Language;
}

export function DepartmentDetailsModal({ departmentId, onClose, language }: DepartmentDetailsModalProps) {
  const [department, setDepartment] = useState<DepartmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/departments/${departmentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch department details');
        }
        
        const data = await response.json();
        setDepartment(data);
      } catch (err) {
        console.error('Error fetching department:', err);
        setError(language === 'pt' ? 'Erro ao carregar departamento' : 'Failed to load department');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [departmentId, language]);

  const getRoleTranslation = (role: string) => {
    const translations: Record<string, Record<Language, string>> = {
      ADMIN: { pt: 'Administrador', en: 'Admin', es: 'Administrador', fr: 'Administrateur' },
      MANAGER: { pt: 'Gerente', en: 'Manager', es: 'Gerente', fr: 'Gestionnaire' },
      SUPERVISOR: { pt: 'Supervisor', en: 'Supervisor', es: 'Supervisor', fr: 'Superviseur' },
      STAFF: { pt: 'Staff', en: 'Staff', es: 'Personal', fr: 'Personnel' }
    };
    return translations[role]?.[language] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'SUPERVISOR':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'STAFF':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Building2 className="h-6 w-6 text-primary" />
            {language === 'pt' ? 'Detalhes do Departamento' : 'Department Details'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : department ? (
          <ScrollArea className="flex-1 overflow-y-auto pr-4 max-h-[calc(90vh-200px)]">
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{department.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold">{department._count.users}</span>
                      <span className="text-sm text-muted-foreground">
                        {language === 'pt' ? 'Utilizadores' : 'Users'}
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold">{department._count.teams}</span>
                      <span className="text-sm text-muted-foreground">
                        {language === 'pt' ? 'Equipas' : 'Teams'}
                      </span>
                    </div>
                  </div>

                  {department.template && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium mb-2">Template:</h4>
                      <Badge variant="secondary">{department.template.name}</Badge>
                      {department.template.customFields?.length > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {department.template.customFields.length} {language === 'pt' ? 'campos' : 'fields'}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Users List */}
              {department.users.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {language === 'pt' ? 'Utilizadores' : 'Users'} ({department.users.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {department.users.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer hover:shadow-md"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedUserId(user.id);
                            }
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {user.name || user.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {getRoleTranslation(user.role)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Teams List */}
              {department.teams.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      {language === 'pt' ? 'Equipas' : 'Teams'} ({department.teams.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {department.teams.map((team) => (
                        <div
                          key={team.id}
                          onClick={() => setSelectedTeamId(team.id)}
                          className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer hover:shadow-md"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedTeamId(team.id);
                            }
                          }}
                        >
                          <div className="font-medium">{team.name}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Custom Fields */}
              {department.template?.customFields && department.template.customFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'pt' ? 'Campos Personalizados' : 'Custom Fields'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {department.template.customFields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">{field.fieldName}</div>
                            <div className="text-sm text-muted-foreground capitalize">{field.fieldType}</div>
                          </div>
                          {department.customFieldsData && department.customFieldsData[field.fieldName] && (
                            <Badge variant="outline">
                              {department.customFieldsData[field.fieldName]}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty States */}
              {department.users.length === 0 && department.teams.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'pt' 
                        ? 'Este departamento ainda não tem utilizadores ou equipas atribuídos.' 
                        : 'This department has no assigned users or teams yet.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        ) : null}

        <div className="flex justify-end pt-4 border-t border-border flex-shrink-0 mt-4">
          <Button variant="outline" onClick={onClose}>
            {language === 'pt' ? 'Fechar' : 'Close'}
          </Button>
        </div>
      </DialogContent>

      {/* User Details Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          language={language}
        />
      )}

      {/* Team Details Modal */}
      {selectedTeamId && (
        <TeamDetailsModal
          teamId={selectedTeamId}
          onClose={() => setSelectedTeamId(null)}
          language={language}
        />
      )}
    </Dialog>
  );
}
