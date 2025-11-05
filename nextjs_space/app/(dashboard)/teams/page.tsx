
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TeamMembersSortable } from '@/components/team-members-sortable';
import { BackButton } from '@/components/back-button';
import { 
  Users, 
  Plus, 
  ChevronRight, 
  Building2, 
  Shield, 
  UserCog, 
  User,
  Trash2,
  Edit,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  description?: string;
  level: string;
  leader?: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
  };
  department: {
    id: string;
    name: string;
  };
  parentTeam?: {
    id: string;
    name: string;
    leader?: {
      id: string;
      name: string;
    };
  };
  childTeams?: {
    id: string;
    name: string;
    level?: string;
    leader?: {
      id: string;
      name: string;
      role: string;
    };
    _count?: {
      members: number;
    };
  }[];
  members: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
  }[];
  _count: {
    members: number;
    childTeams: number;
  };
}

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MANAGER: 'bg-primary/10 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SUPERVISOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  STAFF: 'bg-muted text-foreground dark:bg-gray-800 dark:text-gray-200'
};

const roleIcons = {
  ADMIN: Shield,
  MANAGER: UserCog,
  SUPERVISOR: Building2,
  STAFF: User
};

const levelLabels = {
  COMPANY: 'Empresa',
  MANAGEMENT: 'Gerência',
  SUPERVISION: 'Supervisão',
  OPERATIONS: 'Operações'
};

export default function TeamsPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isAddSubTeamDialogOpen, setIsAddSubTeamDialogOpen] = useState(false);
  const [isViewTeamDialogOpen, setIsViewTeamDialogOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parentTeamForSubTeam, setParentTeamForSubTeam] = useState<Team | null>(null);
  const [isLinkSubTeamDialogOpen, setIsLinkSubTeamDialogOpen] = useState(false);
  const [selectedSubTeamId, setSelectedSubTeamId] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    departmentId: '',
    leaderId: '',
    parentTeamId: 'none'
  });

  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    loadTeams();
    loadDepartments();
    loadUsers();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Erro ao carregar equipas:', error);
      toast.error('Erro ao carregar equipas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error);
    }
  };

  const handleViewTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setViewingTeam(data);
        setIsViewTeamDialogOpen(true);
      } else {
        toast.error('Erro ao carregar detalhes da equipa');
      }
    } catch (error) {
      console.error('Erro ao carregar equipa:', error);
      toast.error('Erro ao carregar detalhes da equipa');
    }
  };

  const handleCreateTeam = async () => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });

      if (response.ok) {
        toast.success('Equipa criada com sucesso!');
        setIsCreateDialogOpen(false);
        setIsAddSubTeamDialogOpen(false);
        setNewTeam({
          name: '',
          description: '',
          departmentId: '',
          leaderId: '',
          parentTeamId: 'none'
        });
        setParentTeamForSubTeam(null);
        loadTeams();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar equipa');
      }
    } catch (error) {
      console.error('Erro ao criar equipa:', error);
      toast.error('Erro ao criar equipa');
    }
  };

  const handleOpenSubTeamDialog = (parentTeam: Team) => {
    setParentTeamForSubTeam(parentTeam);
    setNewTeam({
      name: '',
      description: '',
      departmentId: parentTeam.department.id,
      leaderId: '',
      parentTeamId: parentTeam.id
    });
    setIsAddSubTeamDialogOpen(true);
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTeam.name,
          description: selectedTeam.description,
          leaderId: selectedTeam.leader?.id,
          parentTeamId: selectedTeam.parentTeam?.id
        })
      });

      if (response.ok) {
        toast.success('Equipa atualizada com sucesso!');
        setIsEditDialogOpen(false);
        setSelectedTeam(null);
        loadTeams();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar equipa');
      }
    } catch (error) {
      console.error('Erro ao atualizar equipa:', error);
      toast.error('Erro ao atualizar equipa');
    }
  };

  const handleDeleteTeamClick = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      const response = await fetch(`/api/teams/${teamToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mostrar mensagem de sucesso com detalhes
        let message = 'Equipa excluída com sucesso!';
        if (data.movedToWaitingList && data.movedToWaitingList.length > 0) {
          message += ` ${data.movedToWaitingList.length} membro(s) movido(s) para a lista de espera.`;
        }
        if (data.subteamsUnlinked && data.subteamsUnlinked.length > 0) {
          message += ` ${data.subteamsUnlinked.length} sub-equipa(s) desvinculada(s).`;
        }
        
        toast.success(message);
        setIsDeleteConfirmOpen(false);
        setTeamToDelete(null);
        setIsViewTeamDialogOpen(false);
        loadTeams();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir equipa');
      }
    } catch (error) {
      console.error('Erro ao excluir equipa:', error);
      toast.error('Erro ao excluir equipa');
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserId) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      });

      if (response.ok) {
        toast.success('Membro adicionado com sucesso!');
        setIsAddMemberDialogOpen(false);
        setSelectedUserId('');
        loadTeams();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar membro');
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      toast.error('Erro ao adicionar membro');
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Membro removido com sucesso!');
        loadTeams();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao remover membro');
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const handleOpenLinkSubTeamDialog = (parentTeam: Team) => {
    setParentTeamForSubTeam(parentTeam);
    setSelectedSubTeamId('');
    setIsLinkSubTeamDialogOpen(true);
  };

  const handleLinkSubTeam = async () => {
    if (!parentTeamForSubTeam || !selectedSubTeamId) return;

    try {
      const response = await fetch(`/api/teams/${selectedSubTeamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentTeamId: parentTeamForSubTeam.id
        })
      });

      if (response.ok) {
        toast.success('Sub-equipa vinculada com sucesso!');
        setIsLinkSubTeamDialogOpen(false);
        setSelectedSubTeamId('');
        setParentTeamForSubTeam(null);
        loadTeams();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao vincular sub-equipa');
      }
    } catch (error) {
      console.error('Erro ao vincular sub-equipa:', error);
      toast.error('Erro ao vincular sub-equipa');
    }
  };

  // Função para obter membros disponíveis para adicionar a uma equipa
  const getAvailableMembers = (team: Team) => {
    if (!team || !team.leader) return [];
    
    const leaderRole = team.leader.role;
    const teamDepartmentId = team.department.id;
    
    // Definir roles válidos baseado no líder da equipa
    let validRoles: string[] = [];
    if (leaderRole === 'ADMIN') {
      validRoles = ['MANAGER', 'SUPERVISOR', 'STAFF'];
    } else if (leaderRole === 'MANAGER') {
      validRoles = ['SUPERVISOR', 'STAFF'];
    } else if (leaderRole === 'SUPERVISOR') {
      validRoles = ['STAFF'];
    }
    
    return users.filter(u => {
      // Filtrar por role válido (apenas subordinados do líder)
      if (!validRoles.includes(u.role)) return false;
      
      // Filtrar por departamento
      // Para equipas de ADMIN: qualquer pessoa válida pode ser adicionada
      // Para equipas de MANAGER ou SUPERVISOR: apenas membros do mesmo departamento
      if (leaderRole !== 'ADMIN') {
        // Verificar se o utilizador pertence ao mesmo departamento
        const userDeptId = u.departmentId || u.department?.id;
        if (userDeptId && userDeptId !== teamDepartmentId) {
          return false;
        }
      }
      
      // Não incluir membros que já estão na equipa
      if (team.members.some(m => m.id === u.id)) return false;
      
      return true;
    });
  };

  // Função para obter equipas disponíveis para vincular como sub-equipas
  const getAvailableTeamsForLinking = (parentTeam: Team) => {
    if (!parentTeam) return [];
    
    const parentLevel = parentTeam.level;
    const parentDepartmentId = parentTeam.department.id;
    
    return teams.filter(t => {
      // Não pode vincular a si mesma
      if (t.id === parentTeam.id) return false;
      
      // Não pode vincular se já tem uma equipa pai
      if (t.parentTeam) return false;
      
      // Deve ser do mesmo departamento
      if (t.department.id !== parentDepartmentId) return false;
      
      // Verificar hierarquia de níveis
      if (parentLevel === 'COMPANY') {
        return ['MANAGEMENT', 'SUPERVISION', 'OPERATIONS'].includes(t.level);
      } else if (parentLevel === 'MANAGEMENT') {
        return ['SUPERVISION', 'OPERATIONS'].includes(t.level);
      } else if (parentLevel === 'SUPERVISION') {
        return t.level === 'OPERATIONS';
      }
      
      return false;
    });
  };

  const canCreateTeam = Boolean(session?.user?.role && ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role));
  const canEditTeam = Boolean(session?.user?.role && ['ADMIN', 'MANAGER'].includes(session.user.role));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">A carregar equipas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Equipas</h1>
          <p className="text-muted-foreground mt-1">
            Gerir equipas e membros da organização
          </p>
        </div>
        {canCreateTeam && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Equipa
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Equipa</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da nova equipa
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Equipa *</Label>
                  <Input
                    id="name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Ex: Equipa de Vendas"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Breve descrição da equipa..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <Select
                    value={newTeam.departmentId}
                    onValueChange={(value) => setNewTeam({ ...newTeam, departmentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leader">Líder da Equipa *</Label>
                  <Select
                    value={newTeam.leaderId}
                    onValueChange={(value) => setNewTeam({ ...newTeam, leaderId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(u => ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(u.role))
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {session?.user?.role === 'MANAGER' && (
                  <div className="space-y-2">
                    <Label htmlFor="parentTeam">Equipa Pai (opcional)</Label>
                    <Select
                      value={newTeam.parentTeamId}
                      onValueChange={(value) => setNewTeam({ ...newTeam, parentTeamId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma equipa pai" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {teams
                          .filter(t => t.level === 'MANAGEMENT')
                          .map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTeam} disabled={!newTeam.name || !newTeam.leaderId || !newTeam.departmentId}>
                  Criar Equipa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma equipa encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece por criar a sua primeira equipa
            </p>
            {canCreateTeam && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Equipa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const RoleIcon = roleIcons[team.leader?.role as keyof typeof roleIcons] || User;
            
            return (
              <Card key={team.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {team.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    {canEditTeam && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedTeam(team);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteTeamClick(team)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Level & Department */}
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {levelLabels[team.level as keyof typeof levelLabels] || team.level}
                    </Badge>
                    <Badge variant="outline">
                      <Building2 className="h-3 w-3 mr-1" />
                      {team.department.name}
                    </Badge>
                  </div>

                  {/* Leader */}
                  {team.leader && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={team.leader.image} alt={team.leader.name} />
                        <AvatarFallback>
                          {team.leader.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{team.leader.name}</p>
                        <div className="flex items-center gap-1">
                          <RoleIcon className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">{team.leader.role}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="text-center p-2">
                      <div className="text-2xl font-bold">{team._count.members}</div>
                      <div className="text-xs text-muted-foreground">Membros</div>
                    </div>
                    <div className="text-center p-2">
                      <div className="text-2xl font-bold">{team._count.childTeams}</div>
                      <div className="text-xs text-muted-foreground">Sub-equipas</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewTeam(team.id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Users className="h-4 w-4 mr-2" />
                            Ver Membros
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Membros de {team.name}</DialogTitle>
                            <DialogDescription>
                              Lista de todos os membros da equipa
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {canEditTeam && (
                              <Button
                                className="w-full"
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setIsAddMemberDialogOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Adicionar Membro
                              </Button>
                            )}
                            {team.members.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                Nenhum membro nesta equipa
                              </div>
                            ) : (
                              <TeamMembersSortable
                                teamId={team.id}
                                members={team.members}
                                leaderId={team.leader?.id}
                                canEdit={canEditTeam}
                                onRemoveMember={(memberId) => handleRemoveMember(team.id, memberId)}
                                onMemberClick={(memberId) => router.push(`/users/${memberId}`)}
                              />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Botões para adicionar sub-equipa */}
                    {canEditTeam && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleOpenSubTeamDialog(team)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Sub-equipa
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleOpenLinkSubTeamDialog(team)}
                        >
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Vincular Equipa
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Parent Team */}
                  {team.parentTeam && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <ChevronRight className="h-3 w-3" />
                      <span>Sub-equipa de {team.parentTeam.name}</span>
                    </div>
                  )}

                  {/* Child Teams */}
                  {team.childTeams && team.childTeams.length > 0 && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Sub-equipas:</p>
                      {team.childTeams.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleViewTeam(child.id)}
                          className="w-full text-xs flex items-center gap-1 text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors text-left p-1 rounded hover:bg-muted"
                        >
                          <ChevronRight className="h-3 w-3" />
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
            <DialogDescription>
              Selecione um utilizador para adicionar à equipa {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Utilizador</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um utilizador" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTeam && getAvailableMembers(selectedTeam).length > 0 ? (
                    getAvailableMembers(selectedTeam).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.role}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum membro disponível
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Equipa</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da equipa
            </DialogDescription>
          </DialogHeader>
          {selectedTeam && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome da Equipa</Label>
                <Input
                  id="edit-name"
                  value={selectedTeam.name}
                  onChange={(e) => setSelectedTeam({ ...selectedTeam, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={selectedTeam.description || ''}
                  onChange={(e) => setSelectedTeam({ ...selectedTeam, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-leader">Líder da Equipa</Label>
                <Select
                  value={selectedTeam.leader?.id || undefined}
                  onValueChange={(value) => {
                    const leader = users.find(u => u.id === value);
                    if (leader) {
                      setSelectedTeam({
                        ...selectedTeam,
                        leader: {
                          id: leader.id,
                          name: leader.name,
                          email: leader.email,
                          role: leader.role,
                          image: leader.image
                        }
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um líder" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(u.role))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTeam}>
              Guardar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Team Details Dialog */}
      <Dialog open={isViewTeamDialogOpen} onOpenChange={setIsViewTeamDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingTeam && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{viewingTeam.name}</DialogTitle>
                <DialogDescription>
                  {viewingTeam.description || 'Sem descrição'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Team Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Nível</p>
                    <Badge variant="outline">
                      {levelLabels[viewingTeam.level as keyof typeof levelLabels] || viewingTeam.level}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Departamento</p>
                    <Badge variant="outline">
                      <Building2 className="h-3 w-3 mr-1" />
                      {viewingTeam.department.name}
                    </Badge>
                  </div>
                </div>

                {/* Parent Team */}
                {viewingTeam.parentTeam && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Equipa Pai</p>
                    <button
                      onClick={() => handleViewTeam(viewingTeam.parentTeam!.id)}
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors w-full text-left"
                    >
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{viewingTeam.parentTeam.name}</p>
                        {viewingTeam.parentTeam.leader && (
                          <p className="text-xs text-muted-foreground">
                            Líder: {viewingTeam.parentTeam.leader.name}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                )}

                {/* Leader */}
                {viewingTeam.leader && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Líder</p>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={viewingTeam.leader.image} alt={viewingTeam.leader.name} />
                        <AvatarFallback>
                          {viewingTeam.leader.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{viewingTeam.leader.name}</p>
                        <p className="text-sm text-muted-foreground">{viewingTeam.leader.email}</p>
                        <Badge className={`${roleColors[viewingTeam.leader.role as keyof typeof roleColors]} mt-1`}>
                          {viewingTeam.leader.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Members */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Membros ({viewingTeam._count.members})
                    </p>
                    {canEditTeam && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTeam(viewingTeam);
                          setIsAddMemberDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                  {viewingTeam.members.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg">
                      Nenhum membro nesta equipa
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      <TeamMembersSortable
                        teamId={viewingTeam.id}
                        members={viewingTeam.members}
                        leaderId={viewingTeam.leader?.id}
                        canEdit={canEditTeam}
                        onRemoveMember={(memberId) => {
                          handleRemoveMember(viewingTeam.id, memberId);
                          // Atualizar o viewingTeam também
                          handleViewTeam(viewingTeam.id);
                        }}
                        onMemberClick={(memberId) => router.push(`/users/${memberId}`)}
                      />
                    </div>
                  )}
                </div>

                {/* Sub-teams */}
                {viewingTeam.childTeams && viewingTeam.childTeams.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Sub-equipas ({viewingTeam._count.childTeams})
                    </p>
                    <div className="space-y-2">
                      {viewingTeam.childTeams.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleViewTeam(child.id)}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors w-full text-left"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{child.name}</p>
                            {child.leader && (
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground truncate">
                                  Líder: {child.leader.name}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {child.leader.role}
                                </Badge>
                              </div>
                            )}
                            {child._count && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {child._count.members} membro{child._count.members !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {canEditTeam && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenSubTeamDialog(viewingTeam)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Sub-equipa
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenLinkSubTeamDialog(viewingTeam)}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Vincular Equipa
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTeam(viewingTeam);
                          setIsEditDialogOpen(true);
                          setIsViewTeamDialogOpen(false);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          handleDeleteTeamClick(viewingTeam);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Existing Team as Sub-Team Dialog */}
      <Dialog open={isLinkSubTeamDialogOpen} onOpenChange={setIsLinkSubTeamDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Equipa Existente como Sub-equipa</DialogTitle>
            <DialogDescription>
              Selecione uma equipa existente para vincular a <strong>{parentTeamForSubTeam?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-team">Selecionar Equipa *</Label>
              <Select value={selectedSubTeamId} onValueChange={setSelectedSubTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipa" />
                </SelectTrigger>
                <SelectContent>
                  {parentTeamForSubTeam && getAvailableTeamsForLinking(parentTeamForSubTeam).length > 0 ? (
                    getAvailableTeamsForLinking(parentTeamForSubTeam).map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} - {levelLabels[team.level as keyof typeof levelLabels]} ({team._count.members} membros)
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhuma equipa disponível para vincular
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Apenas equipas do mesmo departamento e de nível hierárquico inferior podem ser vinculadas
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Equipa Pai:</strong> {parentTeamForSubTeam?.name}<br />
                <strong>Nível:</strong> {parentTeamForSubTeam ? levelLabels[parentTeamForSubTeam.level as keyof typeof levelLabels] : ''}<br />
                <strong>Departamento:</strong> {parentTeamForSubTeam?.department.name}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsLinkSubTeamDialogOpen(false);
              setSelectedSubTeamId('');
              setParentTeamForSubTeam(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleLinkSubTeam} disabled={!selectedSubTeamId}>
              Vincular Sub-equipa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sub-Team Dialog */}
      <Dialog open={isAddSubTeamDialogOpen} onOpenChange={setIsAddSubTeamDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Sub-equipa</DialogTitle>
            <DialogDescription>
              Criar uma sub-equipa para <strong>{parentTeamForSubTeam?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sub-name">Nome da Sub-equipa *</Label>
              <Input
                id="sub-name"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="Ex: Equipa de Vendas Online"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-description">Descrição</Label>
              <Textarea
                id="sub-description"
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                placeholder="Breve descrição da sub-equipa..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-leader">Líder da Sub-equipa *</Label>
              <Select
                value={newTeam.leaderId}
                onValueChange={(value) => setNewTeam({ ...newTeam, leaderId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => {
                      // Para sub-equipas de ADMIN (nível empresa), líder deve ser MANAGER ou SUPERVISOR
                      if (parentTeamForSubTeam?.level === 'COMPANY') {
                        return ['MANAGER', 'SUPERVISOR'].includes(u.role);
                      }
                      // Para sub-equipas de MANAGER (nível gestão), líder deve ser SUPERVISOR
                      if (parentTeamForSubTeam?.level === 'MANAGEMENT') {
                        return u.role === 'SUPERVISOR';
                      }
                      // Para sub-equipas de SUPERVISOR (nível supervisão), não deveria ter sub-equipas
                      return false;
                    })
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O líder deve ser de nível hierárquico inferior à equipa pai
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Equipa Pai:</strong> {parentTeamForSubTeam?.name}<br />
                <strong>Departamento:</strong> {parentTeamForSubTeam?.department.name}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddSubTeamDialogOpen(false);
              setNewTeam({
                name: '',
                description: '',
                departmentId: '',
                leaderId: '',
                parentTeamId: 'none'
              });
              setParentTeamForSubTeam(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTeam} disabled={!newTeam.name || !newTeam.leaderId}>
              Criar Sub-equipa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>
                  Tem certeza que deseja excluir a equipa <strong>{teamToDelete?.name}</strong>?
                </p>
                
                {teamToDelete && (
                  <div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
                    {teamToDelete._count.members > 0 && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-orange-600" />
                        <div>
                          <p className="font-medium text-orange-600">
                            {teamToDelete._count.members} membro(s) serão movidos para a lista de espera
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {teamToDelete.leader && 'Incluindo o líder da equipa'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {teamToDelete._count.childTeams > 0 && (
                      <div className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                        <div>
                          <p className="font-medium text-primary">
                            {teamToDelete._count.childTeams} sub-equipa(s) serão desvinculadas
                          </p>
                          <p className="text-xs text-muted-foreground">
                            As sub-equipas permanecerão intactas, apenas perderão o vínculo com esta equipa
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {teamToDelete._count.members === 0 && teamToDelete._count.childTeams === 0 && (
                      <p className="text-muted-foreground text-center py-2">
                        Esta equipa está vazia e pode ser excluída sem afetar outros utilizadores
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-destructive font-medium">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setTeamToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
