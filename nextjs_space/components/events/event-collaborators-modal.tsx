
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTranslation, Language } from '@/lib/i18n';
import { Users, X, UserPlus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';

interface Collaborator {
  id: string;
  userId: string;
  role: string;
  canManage: boolean;
  canChat: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    department: {
      id: string;
      name: string;
    } | null;
  };
}

interface EventCollaboratorsModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  language: Language;
  canManage: boolean;
}

export function EventCollaboratorsModal({
  open,
  onClose,
  eventId,
  language,
  canManage,
}: EventCollaboratorsModalProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState('none');
  const [selectedRole, setSelectedRole] = useState('MEMBER');

  const t = (key: any) => getTranslation(key, language);

  useEffect(() => {
    if (open) {
      loadCollaborators();
      loadUsers();
    }
  }, [open, eventId]);

  const loadCollaborators = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/collaborators`);
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data);
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    } finally {
      setLoading(false);
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
      console.error('Error loading users:', error);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedUser || selectedUser === 'none') {
      toast.error(t('errorOccurred'));
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`/api/events/${eventId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          role: selectedRole,
          canManage: selectedRole === 'COORDINATOR',
          canChat: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add collaborator');
      }

      const newCollaborator = await response.json();
      setCollaborators([...collaborators, newCollaborator]);
      setSelectedUser('none');
      setSelectedRole('MEMBER');
      toast.success(t('collaboratorAdded'));
    } catch (error: any) {
      console.error('Error adding collaborator:', error);
      toast.error(error.message || t('errorOccurred'));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!confirm(t('confirm'))) return;

    try {
      const response = await fetch(
        `/api/events/${eventId}/collaborators/${userId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove collaborator');
      }

      setCollaborators(collaborators.filter((c) => c.userId !== userId));
      toast.success(t('collaboratorRemoved'));
    } catch (error: any) {
      console.error('Error removing collaborator:', error);
      toast.error(error.message || t('errorOccurred'));
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      COORDINATOR: 'eventCoordinator',
      MANAGER: 'eventManager',
      MEMBER: 'eventMember',
      EXTERNAL: 'eventExternal',
    };
    return t(roleMap[role] || 'eventMember');
  };

  const availableUsers = users.filter(
    (user) => !collaborators.find((c) => c.userId === user.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('eventCollaborators')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Collaborator */}
          {canManage && (
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t('addCollaborator')}
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('users')}</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('users')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t('selectUser') || 'Selecione um usuário'}
                      </SelectItem>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('role')}</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COORDINATOR">
                        {t('eventCoordinator')}
                      </SelectItem>
                      <SelectItem value="MANAGER">{t('eventManager')}</SelectItem>
                      <SelectItem value="MEMBER">{t('eventMember')}</SelectItem>
                      <SelectItem value="EXTERNAL">{t('eventExternal')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAddCollaborator}
                disabled={!selectedUser || selectedUser === 'none' || adding}
                className="w-full"
              >
                {adding ? t('loading') : t('addCollaborator')}
              </Button>
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">
                {t('loading')}
              </p>
            ) : collaborators.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('noUsers')}
              </p>
            ) : (
              collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <UserAvatar user={collaborator.user} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {collaborator.user.name || collaborator.user.email}
                        </p>
                        {collaborator.canManage && (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getRoleLabel(collaborator.role)}
                        </Badge>
                        {collaborator.user.department && (
                          <span className="text-xs">
                            {collaborator.user.department.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaborator.userId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
