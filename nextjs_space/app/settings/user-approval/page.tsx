
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, UserX, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  department: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
}

export default function UserApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      // Apenas admins podem acessar esta página
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        toast({
          title: 'Acesso negado',
          description: 'Apenas administradores podem acessar esta página.',
          variant: 'destructive',
        });
        return;
      }

      loadPendingUsers();
    }
  }, [status, session, router]);

  const loadPendingUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/approval');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários pendentes');
      }

      const data = await response.json();
      setPendingUsers(data.users || []);
    } catch (error) {
      console.error('Error loading pending users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários pendentes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string, userName: string | null) => {
    if (processingUserId) return;

    try {
      setProcessingUserId(userId);
      const response = await fetch(`/api/users/approval/${userId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aprovar usuário');
      }

      toast({
        title: 'Usuário aprovado',
        description: `${userName || 'Usuário'} foi aprovado com sucesso!`,
      });

      // Recarregar lista
      loadPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível aprovar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId: string, userName: string | null) => {
    if (processingUserId) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja rejeitar ${userName || 'este usuário'}? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setProcessingUserId(userId);
      const response = await fetch(`/api/users/approval/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao rejeitar usuário');
      }

      toast({
        title: 'Usuário removido',
        description: `${userName || 'Usuário'} foi removido com sucesso.`,
      });

      // Recarregar lista
      loadPendingUsers();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o usuário.',
        variant: 'destructive',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      MANAGER: 'bg-blue-100 text-blue-800',
      SUPERVISOR: 'bg-yellow-100 text-yellow-800',
      STAFF: 'bg-green-100 text-green-800',
    };

    const roleLabels: Record<string, string> = {
      ADMIN: 'Administrador',
      MANAGER: 'Gestor',
      SUPERVISOR: 'Supervisor',
      STAFF: 'Funcionário',
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <SettingsSection
        title="Aprovação de Usuários"
        description="Gerir pedidos de acesso ao sistema"
        icon={UserCheck}
      >
        <SettingsCard
          title="Usuários Pendentes"
          description="Lista de usuários aguardando aprovação para acessar o sistema"
        >
          {pendingUsers.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Não há usuários pendentes de aprovação no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Existem {pendingUsers.length} {pendingUsers.length === 1 ? 'usuário' : 'usuários'} aguardando aprovação.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {user.name || 'Nome não informado'}
                          </h3>
                          {getRoleBadge(user.role)}
                        </div>

                        <p className="text-sm text-gray-600">{user.email}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {user.department && (
                            <span>📂 {user.department.name}</span>
                          )}
                          {user.team && (
                            <span>👥 {user.team.name}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            Registrado {formatDistanceToNow(new Date(user.createdAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(user.id, user.name)}
                          disabled={processingUserId === user.id}
                        >
                          {processingUserId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Aprovar
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.id, user.name)}
                          disabled={processingUserId === user.id}
                        >
                          {processingUserId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Rejeitar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
