
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { UserDepartmentsManager } from './user-departments-manager';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UserAvatar } from './user-avatar';
import { getTranslation, Language } from '@/lib/i18n';
import { 
  User as UserIcon, 
  Mail, 
  Briefcase, 
  Building2, 
  Users as UsersIcon, 
  Calendar,
  Globe,
  Clock,
  CheckCircle2,
  Loader2,
  Phone,
  MapPin,
  CreditCard,
  Cake,
  Hash,
  AlertCircle,
  UserCircle,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
  companyId: string;
  departmentId?: string | null;
  teamId?: string | null;
  department: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  language?: string;
  createdAt: string;
  // Dados Pessoais
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  birthDate?: string | null;
  taxId?: string | null;
  // Dados Profissionais
  employeeNumber?: string | null;
  hireDate?: string | null;
  jobTitle?: string | null;
  // Contacto de Emergência
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
  language: Language;
}

interface DetailedUser extends User {
  assignedTasksCount?: number;
  shiftsCount?: number;
  ledTeamsCount?: number;
  ledTeams?: Array<{ id: string; name: string }>;
}

export function UserDetailsModal({ userId, onClose, language }: UserDetailsModalProps) {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role || 'STAFF';
  const [user, setUser] = useState<DetailedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  // Verificar se hoje é aniversário
  const isBirthdayToday = (birthDate: string | null | undefined) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do utilizador:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleTranslation = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return getTranslation('admin', language);
      case 'MANAGER':
        return getTranslation('manager', language);
      case 'SUPERVISOR':
        return getTranslation('supervisor', language);
      case 'STAFF':
        return getTranslation('staff', language);
      default:
        return role;
    }
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
        return 'bg-muted text-foreground';
    }
  };

  const getLanguageLabel = (lang?: string) => {
    switch (lang) {
      case 'pt':
        return 'Português';
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      default:
        return lang || 'Português';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'pt' ? ptBR : enUS;
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale });
  };

  const formatDateOnly = (dateString?: string | null) => {
    if (!dateString) return language === 'pt' ? 'Não definido' : 'Not set';
    const date = new Date(dateString);
    const locale = language === 'pt' ? ptBR : enUS;
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale });
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === 'pt' ? 'Utilizador não encontrado' : 'User not found'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <UserIcon className="h-5 w-5 text-primary" />
            {language === 'pt' ? 'Detalhes do Utilizador' : 'User Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Header */}
          <div className="flex items-start gap-6">
            <div 
              onClick={() => user.image && setShowImageModal(true)}
              className={`${user.image ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              title={user.image ? (language === 'pt' ? 'Clique para ampliar' : 'Click to enlarge') : ''}
            >
              <UserAvatar user={user} size="xl" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{user.name || user.email}</h2>
                {isBirthdayToday(user.birthDate) && (
                  <Badge className="text-base px-3 py-1 bg-gradient-to-r from-pink-500 to-yellow-500 text-white animate-pulse">
                    🎂 {language === 'pt' ? 'Feliz Aniversário!' : 'Happy Birthday!'}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {getRoleTranslation(user.role)}
                </Badge>
                {user.department && (
                  <Badge variant="secondary">
                    <Building2 className="h-3 w-3 mr-1" />
                    {user.department.name}
                  </Badge>
                )}
                {user.team && (
                  <Badge variant="outline">
                    <UsersIcon className="h-3 w-3 mr-1" />
                    {user.team.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs Content */}
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full inline-flex h-auto flex-wrap justify-start gap-1 p-1 lg:grid lg:grid-cols-5">
              <TabsTrigger value="general" className="flex-1 min-w-[100px] whitespace-nowrap">
                {language === 'pt' ? 'Geral' : 'General'}
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex-1 min-w-[100px] whitespace-nowrap">
                {language === 'pt' ? 'Pessoal' : 'Personal'}
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex-1 min-w-[100px] whitespace-nowrap">
                {language === 'pt' ? 'Profissional' : 'Professional'}
              </TabsTrigger>
              <TabsTrigger value="emergency" className="flex-1 min-w-[100px] whitespace-nowrap">
                {language === 'pt' ? 'Emergência' : 'Emergency'}
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex-1 min-w-[100px] whitespace-nowrap">
                {language === 'pt' ? 'Estatísticas' : 'Statistics'}
              </TabsTrigger>
            </TabsList>

            {/* Tab Geral */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">
                    {language === 'pt' ? 'Informações de Contacto' : 'Contact Information'}
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Email' : 'Email'}
                        </p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Idioma' : 'Language'}
                        </p>
                        <p className="font-medium">{getLanguageLabel(user.language)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">
                    {language === 'pt' ? 'Informações Organizacionais' : 'Organizational Information'}
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Cargo' : 'Role'}
                        </p>
                        <p className="font-medium">{getRoleTranslation(user.role)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Departamento' : 'Department'}
                        </p>
                        <p className="font-medium">
                          {user.department?.name || (language === 'pt' ? 'Sem departamento' : 'No department')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <UsersIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Equipa' : 'Team'}
                        </p>
                        <p className="font-medium">
                          {user.team?.name || (language === 'pt' ? 'Sem equipa' : 'No team')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Membro desde' : 'Member since'}
                        </p>
                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Pessoal */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">
                    {language === 'pt' ? 'Dados Pessoais' : 'Personal Information'}
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Telefone' : 'Phone'}
                        </p>
                        <p className="font-medium">
                          {user.phone || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Cake className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Data de Nascimento' : 'Birth Date'}
                        </p>
                        <p className="font-medium">{formatDateOnly(user.birthDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'NIF / CPF' : 'Tax ID'}
                        </p>
                        <p className="font-medium">
                          {user.taxId || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Morada' : 'Address'}
                        </p>
                        <p className="font-medium">
                          {user.address || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Cidade' : 'City'}
                        </p>
                        <p className="font-medium">
                          {user.city || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Estado/Distrito' : 'State/District'}
                        </p>
                        <p className="font-medium">
                          {user.state || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Código Postal' : 'Postal Code'}
                        </p>
                        <p className="font-medium">
                          {user.postalCode || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'País' : 'Country'}
                        </p>
                        <p className="font-medium">
                          {user.country || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Profissional */}
            <TabsContent value="professional" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">
                    {language === 'pt' ? 'Dados Profissionais' : 'Professional Information'}
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Número de Funcionário' : 'Employee Number'}
                        </p>
                        <p className="font-medium">
                          {user.employeeNumber || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Data de Contratação' : 'Hire Date'}
                        </p>
                        <p className="font-medium">{formatDateOnly(user.hireDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Cargo' : 'Job Title'}
                        </p>
                        <p className="font-medium">
                          {user.jobTitle || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Departamento Principal' : 'Primary Department'}
                        </p>
                        <p className="font-medium">
                          {user.department?.name || (language === 'pt' ? 'Sem departamento' : 'No department')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Múltiplos Departamentos */}
                  <div className="pt-6 border-t">
                    <UserDepartmentsManager
                      userId={user.id}
                      companyId={user.companyId}
                      canEdit={currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER'}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Emergência */}
            <TabsContent value="emergency" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-lg">
                      {language === 'pt' ? 'Contacto de Emergência' : 'Emergency Contact'}
                    </h3>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                        <UserCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Nome' : 'Name'}
                        </p>
                        <p className="font-medium">
                          {user.emergencyContactName || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                        <Phone className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Telefone' : 'Phone'}
                        </p>
                        <p className="font-medium">
                          {user.emergencyContactPhone || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:col-span-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                        <UsersIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Relação' : 'Relation'}
                        </p>
                        <p className="font-medium">
                          {user.emergencyContactRelation || (language === 'pt' ? 'Não definido' : 'Not set')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Estatísticas */}
            <TabsContent value="statistics" className="space-y-4">
              {(user.assignedTasksCount !== undefined || user.shiftsCount !== undefined || user.ledTeamsCount !== undefined) && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">
                      {language === 'pt' ? 'Estatísticas' : 'Statistics'}
                    </h3>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      {user.assignedTasksCount !== undefined && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{user.assignedTasksCount}</p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'pt' ? 'Tarefas' : 'Tasks'}
                            </p>
                          </div>
                        </div>
                      )}

                      {user.shiftsCount !== undefined && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{user.shiftsCount}</p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'pt' ? 'Turnos' : 'Shifts'}
                            </p>
                          </div>
                        </div>
                      )}

                      {user.ledTeamsCount !== undefined && user.ledTeamsCount > 0 && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <UsersIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{user.ledTeamsCount}</p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'pt' ? 'Equipas Lideradas' : 'Teams Led'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {user.ledTeams && user.ledTeams.length > 0 && (
                      <div className="pt-4">
                        <p className="text-sm font-medium mb-2">
                          {language === 'pt' ? 'Líder das seguintes equipas:' : 'Leader of the following teams:'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {user.ledTeams.map((team) => (
                            <Badge key={team.id} variant="secondary">
                              {team.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Image Lightbox Modal */}
      {showImageModal && user?.image && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/90 border-none">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label={language === 'pt' ? 'Fechar' : 'Close'}
              >
                <X className="h-6 w-6" />
              </button>

              {/* Full Size Image */}
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={`/api/profile/photo/url?userId=${user.id}`}
                  alt={user.name || user.email}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
