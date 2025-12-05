
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { SortableList } from './ui/sortable-list';
import { User, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

interface TeamMembersSortableProps {
  teamId: string;
  members: TeamMember[];
  leaderId?: string;
  canEdit: boolean;
  onRemoveMember: (memberId: string) => void;
  onMemberClick: (memberId: string) => void;
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MANAGER: 'bg-primary/10 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SUPERVISOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  STAFF: 'bg-muted text-foreground dark:bg-gray-800 dark:text-gray-200'
};

const roleIcons = {
  ADMIN: User,
  MANAGER: User,
  SUPERVISOR: User,
  STAFF: User
};

export function TeamMembersSortable({
  teamId,
  members,
  leaderId,
  canEdit,
  onRemoveMember,
  onMemberClick
}: TeamMembersSortableProps) {
  const [sortedMembers, setSortedMembers] = useState(members);

  const handleReorder = async (reorderedMembers: TeamMember[]) => {
    // Optimistic update
    setSortedMembers(reorderedMembers);

    try {
      const orderedIds = reorderedMembers.map((member) => member.id);
      const response = await fetch(`/api/teams/${teamId}/members/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder members');
      }

      toast.success('Ordem atualizada com sucesso!');
    } catch (error) {
      // Revert on error
      setSortedMembers(members);
      toast.error('Erro ao reordenar membros');
    }
  };

  const renderMember = (member: TeamMember) => {
    const MemberRoleIcon = roleIcons[member.role as keyof typeof roleIcons] || User;

    return (
      <div
        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
        onClick={() => onMemberClick(member.id)}
      >
        <Avatar>
          <AvatarImage src={member.image} alt={member.name} />
          <AvatarFallback>
            {member.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{member.name}</p>
          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
        </div>
        <Badge className={roleColors[member.role as keyof typeof roleColors]}>
          <MemberRoleIcon className="h-3 w-3 mr-1" />
          {member.role}
        </Badge>
        {canEdit && member.id !== leaderId && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveMember(member.id);
            }}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <SortableList
      items={sortedMembers}
      onReorder={handleReorder}
      renderItem={renderMember}
      getId={(member) => member.id}
      disabled={!canEdit}
    />
  );
}
