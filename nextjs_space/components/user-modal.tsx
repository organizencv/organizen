
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { getTranslation, Language } from '@/lib/i18n';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  departmentId?: string | null;
  teamId?: string | null;
  department: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  birthDate?: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  department: { name: string };
}

interface UserModalProps {
  user: User | null;
  departments: Department[];
  teams: Team[];
  onClose: () => void;
  onSaved: (user: any) => void;
  language: Language;
}

export function UserModal({ user, departments, teams, onClose, onSaved, language }: UserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRemovalWarning, setShowRemovalWarning] = useState(false);
  const [affectedTeams, setAffectedTeams] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'STAFF',
    departmentId: 'no-department',
    teamId: 'no-team',
    birthDate: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    // Reset form when user changes
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'STAFF',
        departmentId: user.departmentId || user.department?.id || 'no-department',
        teamId: user.teamId || user.team?.id || 'no-team',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'STAFF',
        departmentId: 'no-department',
        teamId: 'no-team',
        birthDate: '',
      });
    }
  }, [user]);

  // Filter teams by selected department
  const filteredTeams = formData.departmentId && formData.departmentId !== 'no-department'
    ? teams?.filter(team => {
        // Get the department of the team
        const teamDept = departments?.find(d => d?.name === team?.department?.name);
        return teamDept?.id === formData.departmentId;
      }) || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editing a user, check if they will be removed from team
    if (user) {
      const isDepartmentChanging = (user.departmentId || user.department?.id || 'no-department') !== formData.departmentId;
      const isRoleChanging = user.role !== formData.role;
      
      if (isDepartmentChanging || isRoleChanging) {
        setIsLoading(true);
        try {
          const checkResponse = await fetch(`/api/users/${user.id}/check-team-removal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              role: formData.role,
              departmentId: formData.departmentId === 'no-department' ? null : formData.departmentId,
            }),
          });

          const checkData = await checkResponse.json();
          
          if (checkData.willBeRemoved && checkData.affectedTeams.length > 0) {
            setAffectedTeams(checkData.affectedTeams);
            setShowRemovalWarning(true);
            setIsLoading(false);
            return; // Stop here and wait for user confirmation
          }
        } catch (error) {
          console.error('Error checking team removal:', error);
        }
        setIsLoading(false);
      }
    }
    
    // Proceed with save
    await saveUser();
  };

  const saveUser = async () => {
    setIsLoading(true);

    try {
      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PUT' : 'POST';

      // Convert special values to null
      const submitData = {
        ...formData,
        departmentId: formData.departmentId === 'no-department' ? null : formData.departmentId,
        teamId: formData.teamId === 'no-team' ? null : formData.teamId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        // Show additional message if user was removed from teams
        if (data.removedFromTeams && data.removedFromTeams.length > 0) {
          toast({
            title: language === 'pt' ? 'Utilizador removido de equipas' : 'User removed from teams',
            description: language === 'pt' 
              ? `Removido de: ${data.removedFromTeams.join(', ')}` 
              : `Removed from: ${data.removedFromTeams.join(', ')}`,
            variant: 'default',
          });
        }
        
        toast({
          title: user 
            ? (language === 'pt' ? 'Utilizador atualizado' : 'User updated')
            : (language === 'pt' ? 'Utilizador criado' : 'User created'),
          description: user 
            ? (language === 'pt' ? 'Utilizador atualizado com sucesso' : 'User updated successfully')
            : (language === 'pt' ? 'Utilizador criado com sucesso' : 'User created successfully'),
        });
        onSaved(data);
      } else {
        throw new Error(data.error || 'Failed to save user');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Reset team when department changes
    if (field === 'departmentId') {
      setFormData(prev => ({ ...prev, [field]: value, teamId: 'no-team' }));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user 
              ? (language === 'pt' ? 'Editar Utilizador' : 'Edit User')
              : getTranslation('newUser', language)
            }
          </DialogTitle>
          <DialogDescription>
            {user 
              ? (language === 'pt' ? 'Edite as informações do utilizador' : 'Edit user information')
              : (language === 'pt' ? 'Adicione um novo utilizador à empresa' : 'Add a new user to the company')
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{getTranslation('name', language)}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder={language === 'pt' ? 'Nome completo' : 'Full name'}
            />
          </div>

          <div>
            <Label htmlFor="email">{getTranslation('email', language)}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              placeholder={language === 'pt' ? 'Email do utilizador' : 'User email'}
            />
          </div>

          <div>
            <Label htmlFor="birthDate">{language === 'pt' ? 'Data de Nascimento' : 'Birth Date'}</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              placeholder={language === 'pt' ? 'Data de nascimento' : 'Birth date'}
            />
          </div>

          {!user && (
            <div>
              <Label htmlFor="password">{getTranslation('password', language)}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                placeholder={language === 'pt' ? 'Password temporária' : 'Temporary password'}
              />
            </div>
          )}

          <div>
            <Label htmlFor="role">{getTranslation('role', language)}</Label>
            <Select value={formData.role || 'STAFF'} onValueChange={(value) => handleChange('role', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">{getTranslation('staff', language)}</SelectItem>
                <SelectItem value="SUPERVISOR">{getTranslation('supervisor', language)}</SelectItem>
                <SelectItem value="MANAGER">{getTranslation('manager', language)}</SelectItem>
                <SelectItem value="ADMIN">{getTranslation('admin', language)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {departments?.length > 0 && (
            <div>
              <Label htmlFor="department">{getTranslation('department', language)}</Label>
              <Select value={formData.departmentId || 'no-department'} onValueChange={(value) => handleChange('departmentId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'pt' ? 'Selecionar departamento' : 'Select department'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-department">{language === 'pt' ? 'Sem departamento' : 'No department'}</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept?.id} value={dept?.id || 'no-department'}>
                      {dept?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredTeams?.length > 0 && (
            <div>
              <Label htmlFor="team">{getTranslation('team', language)}</Label>
              <Select value={formData.teamId || 'no-team'} onValueChange={(value) => handleChange('teamId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'pt' ? 'Selecionar equipa' : 'Select team'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-team">{language === 'pt' ? 'Sem equipa' : 'No team'}</SelectItem>
                  {filteredTeams?.map((team) => (
                    <SelectItem key={team?.id} value={team?.id || 'no-team'}>
                      {team?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {getTranslation('cancel', language)}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? getTranslation('loading', language) : getTranslation('save', language)}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Warning dialog for team removal */}
      <AlertDialog open={showRemovalWarning} onOpenChange={setShowRemovalWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <AlertDialogTitle>
                {language === 'pt' ? 'Aviso: Remoção de Equipa' : 'Warning: Team Removal'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                {language === 'pt' 
                  ? 'Esta mudança de departamento ou cargo fará com que o utilizador seja removido da(s) seguinte(s) equipa(s):' 
                  : 'This change in department or role will cause the user to be removed from the following team(s):'}
              </p>
              <ul className="list-disc pl-5 font-medium">
                {affectedTeams.map((team, idx) => (
                  <li key={idx}>{team}</li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'pt' 
                  ? 'O utilizador será movido para a lista de espera. Deseja continuar?' 
                  : 'The user will be moved to the waiting list. Do you want to continue?'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowRemovalWarning(false);
                saveUser();
              }}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {language === 'pt' ? 'Continuar' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
