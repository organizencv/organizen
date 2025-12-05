
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { X, UserPlus, Crown, User as UserIcon, Eye } from 'lucide-react';
import { getTranslation, Language } from '@/lib/i18n';
import toast from 'react-hot-toast';

interface TaskMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    image: string | null;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
}

interface TaskMembersProps {
  taskId: string;
  task?: any;
  users: User[];
  canEdit: boolean;
  language: Language;
  onUpdate?: () => void;
}

export function TaskMembers({ taskId, task, users, canEdit, language, onUpdate }: TaskMembersProps) {
  const [members, setMembers] = useState<TaskMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');

  const t = (key: any) => getTranslation(key, language);
  const isTaskCompleted = task?.status === 'COMPLETED';

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [taskId]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });

      if (response.ok) {
        toast.success(t('memberAdded'));
        setSelectedUserId('');
        setSelectedRole('MEMBER');
        await fetchMembers();
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || t('error'));
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(t('error'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('memberRemoved'));
        await fetchMembers();
        onUpdate?.();
      } else {
        toast.error(t('error'));
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(t('error'));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-3 w-3" />;
      case 'VIEWER':
        return <Eye className="h-3 w-3" />;
      default:
        return <UserIcon className="h-3 w-3" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-500 text-white';
      case 'VIEWER':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // Filtrar utilizadores que já são membros
  const availableUsers = users.filter(
    user => !members.some(m => m.userId === user.id)
  );

  if (isLoading) {
    return <div className="text-center py-4">{t('loading')}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Lista de Membros */}
      {members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                  {member.user.image ? (
                    <img src={member.user.image} alt={member.user.name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-sm font-medium">
                      {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{member.user.name || member.user.email}</p>
                  <p className="text-xs text-gray-500">{member.user.email}</p>
                </div>
                <Badge className={`flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  <span className="text-xs">
                    {member.role === 'OWNER' && t('owner')}
                    {member.role === 'MEMBER' && t('member')}
                    {member.role === 'VIEWER' && t('viewer')}
                  </span>
                </Badge>
              </div>
              {canEdit && !isTaskCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{t('noMembers')}</p>
        </div>
      )}

      {/* Mensagem para tarefas concluídas */}
      {isTaskCompleted && (
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            {language === 'pt' 
              ? 'Não é possível modificar membros numa tarefa concluída' 
              : 'Cannot modify members in a completed task'}
          </p>
        </div>
      )}

      {/* Adicionar Novo Membro */}
      {canEdit && availableUsers.length > 0 && !isTaskCompleted && (
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
            {t('addMember')}
          </h4>
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('selectUser')} />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">{t('owner')}</SelectItem>
                <SelectItem value="MEMBER">{t('member')}</SelectItem>
                <SelectItem value="VIEWER">{t('viewer')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || isAdding}
              className="flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              {t('add')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
