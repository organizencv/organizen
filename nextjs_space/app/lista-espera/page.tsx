
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Clock, UserPlus, Users, Mail, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SortableList } from '@/components/ui/sortable-list';
import { PageHeader } from '@/components/page-header';

interface WaitingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  department: {
    id: string;
    name: string;
  };
  _count: {
    members: number;
  };
}

export default function ListaEsperaPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<WaitingUser | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, teamsRes] = await Promise.all([
        fetch('/api/lista-espera'),
        fetch('/api/teams')
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setWaitingUsers(data.users || []);
      }

      if (teamsRes.ok) {
        const data = await teamsRes.json();
        // O API retorna o array diretamente, não um objeto com propriedade teams
        setTeams(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToTeam = async () => {
    if (!selectedUser || !selectedTeam) {
      toast.error('Selecione uma equipa');
      return;
    }

    try {
      setIsAssigning(true);
      const response = await fetch('/api/lista-espera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          teamId: selectedTeam,
        }),
      });

      if (response.ok) {
        toast.success('Utilizador adicionado à equipa com sucesso!');
        setShowAssignDialog(false);
        setSelectedUser(null);
        setSelectedTeam('');
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao adicionar utilizador');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao adicionar utilizador');
    } finally {
      setIsAssigning(false);
    }
  };

  const openAssignDialog = (user: WaitingUser) => {
    setSelectedUser(user);
    setSelectedTeam('');
    setShowAssignDialog(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500 hover:bg-red-600';
      case 'MANAGER':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'SUPERVISOR':
        return 'bg-primary/100 hover:bg-blue-600';
      default:
        return 'bg-accent0 hover:bg-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'MANAGER':
        return 'Gestor';
      case 'SUPERVISOR':
        return 'Supervisor';
      case 'STAFF':
        return 'Funcionário';
      default:
        return role;
    }
  };

  const handleReorder = async (reorderedUsers: WaitingUser[]) => {
    // Optimistic update
    setWaitingUsers(reorderedUsers);

    try {
      const orderedIds = reorderedUsers.map((user) => user.id);
      const response = await fetch('/api/lista-espera/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder waiting list');
      }

      toast.success('Ordem atualizada com sucesso!');
    } catch (error) {
      // Revert on error
      loadData();
      toast.error('Erro ao reordenar lista de espera');
    }
  };

  const renderWaitingUser = (user: WaitingUser) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{user.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </CardDescription>
          </div>
          <Badge className={getRoleBadgeColor(user.role)}>
            {getRoleLabel(user.role)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Registado em {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
        <Button
          onClick={() => openAssignDialog(user)}
          className="w-full"
          size="sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar a Equipa
        </Button>
      </CardContent>
    </Card>
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Clock className="h-7 w-7 text-primary" />
            Lista de Espera
          </div>
        }
        showBackButton={true}
        backUrl="/dashboard"
      >
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {waitingUsers.length} {waitingUsers.length === 1 ? 'utilizador' : 'utilizadores'}
        </Badge>
      </PageHeader>

      <p className="text-muted-foreground -mt-2">
        Utilizadores aguardando alocação em equipas
      </p>

      {/* Waiting Users List */}
      {waitingUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum utilizador na lista de espera
            </h3>
            <p className="text-muted-foreground">
              Todos os utilizadores foram alocados em equipas
            </p>
          </CardContent>
        </Card>
      ) : (
        <SortableList
          items={waitingUsers}
          onReorder={handleReorder}
          renderItem={renderWaitingUser}
          getId={(user) => user.id}
        />
      )}

      {/* Assign to Team Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar a Equipa</DialogTitle>
            <DialogDescription>
              Selecione a equipa para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma equipa" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} - {team.department.name} ({team._count.members} membros)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignDialog(false)}
              disabled={isAssigning}
            >
              Cancelar
            </Button>
            <Button onClick={handleAssignToTeam} disabled={isAssigning || !selectedTeam}>
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAssigning ? 'A adicionar...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
