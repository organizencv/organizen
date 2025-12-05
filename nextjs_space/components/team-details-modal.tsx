
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { TeamMembersSortable } from './team-members-sortable';
import { Language } from '@/lib/i18n';
import { 
  Users, 
  ChevronRight, 
  Building2, 
  Loader2,
  Mail,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

interface ChildTeam {
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
}

interface TeamDetails {
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
  childTeams?: ChildTeam[];
  members: TeamMember[];
  _count: {
    members: number;
    childTeams: number;
  };
}

interface TeamDetailsModalProps {
  teamId: string;
  onClose: () => void;
  language: Language;
}

const levelLabels = {
  COMPANY: 'Empresa',
  DEPARTMENT: 'Departamento',
  DIVISION: 'Divisão',
  SECTION: 'Secção',
  TEAM: 'Equipa',
  SUBTEAM: 'Sub-equipa'
};

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SUPERVISOR: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  STAFF: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
};

export function TeamDetailsModal({ teamId, onClose, language }: TeamDetailsModalProps) {
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/teams/${teamId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch team details');
        }
        
        const data = await response.json();
        setTeam(data);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError(language === 'pt' ? 'Erro ao carregar equipa' : 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId, language]);

  const handleViewSubTeam = (subTeamId: string) => {
    // Close current modal and navigate
    onClose();
    router.push(`/teams?viewTeam=${subTeamId}`);
  };

  const handleMemberClick = (memberId: string) => {
    router.push(`/users/${memberId}`);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            {team?.name || (language === 'pt' ? 'Detalhes da Equipa' : 'Team Details')}
          </DialogTitle>
          {team?.description && (
            <DialogDescription>{team.description}</DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : team ? (
          <ScrollArea className="flex-1 overflow-y-auto pr-4 max-h-[calc(90vh-200px)]">
            <div className="space-y-6 py-4">
              {/* Team Info Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {language === 'pt' ? 'Nível' : 'Level'}
                      </p>
                      <Badge variant="outline">
                        {levelLabels[team.level as keyof typeof levelLabels] || team.level}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {language === 'pt' ? 'Departamento' : 'Department'}
                      </p>
                      <Badge variant="outline">
                        <Building2 className="h-3 w-3 mr-1" />
                        {team.department.name}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parent Team */}
              {team.parentTeam && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      {language === 'pt' ? 'Equipa Pai' : 'Parent Team'}
                    </p>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <ChevronRight className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{team.parentTeam.name}</p>
                        {team.parentTeam.leader && (
                          <p className="text-xs text-muted-foreground">
                            {language === 'pt' ? 'Líder:' : 'Leader:'} {team.parentTeam.leader.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Leader */}
              {team.leader && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      {language === 'pt' ? 'Líder' : 'Leader'}
                    </p>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={team.leader.image ? `/api/profile/photo/url?userId=${team.leader.id}` : undefined} 
                          alt={team.leader.name} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {team.leader.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{team.leader.name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {team.leader.email}
                        </div>
                        <Badge className={`${roleColors[team.leader.role as keyof typeof roleColors]} mt-1`}>
                          {team.leader.role}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Members */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === 'pt' ? 'Membros' : 'Members'} ({team._count.members})
                    </p>
                  </div>
                  {team.members.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg">
                      {language === 'pt' ? 'Nenhum membro nesta equipa' : 'No members in this team'}
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      <TeamMembersSortable
                        teamId={team.id}
                        members={team.members}
                        leaderId={team.leader?.id}
                        canEdit={false}
                        onRemoveMember={() => {}}
                        onMemberClick={handleMemberClick}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sub-teams */}
              {team.childTeams && team.childTeams.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      {language === 'pt' ? 'Sub-equipas' : 'Sub-teams'} ({team._count.childTeams})
                    </p>
                    <div className="space-y-2">
                      {team.childTeams.map((child) => (
                        <div
                          key={child.id}
                          onClick={() => handleViewSubTeam(child.id)}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleViewSubTeam(child.id);
                            }
                          }}
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{child.name}</p>
                            {child.leader && (
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground truncate">
                                  {language === 'pt' ? 'Líder:' : 'Leader:'} {child.leader.name}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {child.leader.role}
                                </Badge>
                              </div>
                            )}
                            {child._count && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {child._count.members} {language === 'pt' ? 'membro' : 'member'}{child._count.members !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
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
    </Dialog>
  );
}
