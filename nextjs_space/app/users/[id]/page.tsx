
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  Users, 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CalendarDays,
  ListTodo,
  UserCog
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/page-header';
import { UserDepartmentsManager } from '@/components/user-departments-manager';

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  createdAt: string;
  department?: {
    id: string;
    name: string;
  };
  teams: {
    id: string;
    name: string;
    role: string;
  }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
  }[];
  shifts: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
  }[];
  timeOffRequests: {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    reason?: string;
  }[];
  shiftSwapRequests: {
    id: string;
    status: string;
    requestedDate: string;
    offeredDate: string;
    targetUser: {
      id: string;
      name: string;
    };
  }[];
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MANAGER: 'bg-primary/10 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SUPERVISOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  STAFF: 'bg-muted text-foreground dark:bg-gray-800 dark:text-gray-200'
};

const roleLabels = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  SUPERVISOR: 'Supervisor',
  STAFF: 'Colaborador'
};

const statusColors = {
  TODO: 'bg-muted text-foreground',
  IN_PROGRESS: 'bg-primary/10 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

const statusLabels = {
  TODO: 'Por Fazer',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada'
};

const priorityColors = {
  LOW: 'bg-muted text-foreground',
  MEDIUM: 'bg-primary/10 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

const priorityLabels = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente'
};

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadUserDetails();
    }
  }, [params?.id]);

  const loadUserDetails = async () => {
    try {
      const response = await fetch(`/api/users/${params?.id}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        toast.error('Erro ao carregar detalhes do utilizador');
      }
    } catch (error) {
      console.error('Erro ao carregar utilizador:', error);
      toast.error('Erro ao carregar detalhes do utilizador');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">A carregar detalhes...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Utilizador não encontrado</h3>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <PageHeader 
        title="Perfil do Utilizador"
        backUrl="/users"
      />

      {/* User Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                  <Shield className="h-3 w-3 mr-1" />
                  {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                </Badge>
                {user.department && (
                  <Badge variant="outline">
                    <Building2 className="h-3 w-3 mr-1" />
                    {user.department.name}
                  </Badge>
                )}
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  Membro desde {format(new Date(user.createdAt), 'MMM yyyy', { locale: ptBR })}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.teams?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Equipas atribuídas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.tasks?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {user.tasks?.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length || 0} ativas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.shifts.length}</div>
            <p className="text-xs text-muted-foreground">
              Turnos agendados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.timeOffRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Folgas/férias solicitadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="teams">Equipas</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="shifts">Turnos</TabsTrigger>
          <TabsTrigger value="timeoff">Folgas</TabsTrigger>
          <TabsTrigger value="swaps">Trocas</TabsTrigger>
        </TabsList>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipas</CardTitle>
              <CardDescription>
                Equipas às quais o utilizador pertence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user.teams || user.teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Não pertence a nenhuma equipa</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => router.push('/teams')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{team.name}</p>
                          <p className="text-sm text-muted-foreground">Membro da equipa</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <UserDepartmentsManager 
            userId={user?.id || ''} 
            canEdit={session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas Atribuídas</CardTitle>
              <CardDescription>
                Todas as tarefas atribuídas ao utilizador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user.tasks || user.tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma tarefa atribuída</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">{task.title}</p>
                          <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                            {statusLabels[task.status as keyof typeof statusLabels] || task.status}
                          </Badge>
                          <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                            {priorityLabels[task.priority as keyof typeof priorityLabels] || task.priority}
                          </Badge>
                        </div>
                        {task.dueDate && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Prazo: {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Turnos Agendados</CardTitle>
              <CardDescription>
                Turnos de trabalho do utilizador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.shifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum turno agendado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-blue-900 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {format(new Date(shift.date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {shift.startTime} - {shift.endTime}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{shift.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Off Tab */}
        <TabsContent value="timeoff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Folga/Férias</CardTitle>
              <CardDescription>
                Histórico de pedidos de ausência
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.timeOffRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido de folga/férias</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.timeOffRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{request.type}</Badge>
                          <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                            {statusLabels[request.status as keyof typeof statusLabels] || request.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(request.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(request.endDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      {request.reason && (
                        <p className="text-sm mt-2">{request.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shift Swaps Tab */}
        <TabsContent value="swaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trocas de Turno</CardTitle>
              <CardDescription>
                Pedidos de troca de turno
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.shiftSwapRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma troca de turno solicitada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.shiftSwapRequests.map((swap) => (
                    <div
                      key={swap.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Troca com {swap.targetUser.name}</p>
                        <Badge className={statusColors[swap.status as keyof typeof statusColors]}>
                          {statusLabels[swap.status as keyof typeof statusLabels] || swap.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Turno Oferecido:</p>
                          <p>{format(new Date(swap.offeredDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Turno Solicitado:</p>
                          <p>{format(new Date(swap.requestedDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
