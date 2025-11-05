
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UserModal } from './user-modal';
import { UserDetailsModal } from './user-details-modal';
import { ResetPasswordModal } from './reset-password-modal';
import { getTranslation, Language } from '@/lib/i18n';
import { Plus, Search, Users as UsersIcon, Edit, Trash2, Filter, Building2, Briefcase, KeyRound, Eye } from 'lucide-react';
import { BackButton } from './back-button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  departmentId?: string | null;
  teamId?: string | null;
  department: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  createdAt: string;
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

interface UsersContentProps {
  users: User[];
  departments: Department[];
  teams: Team[];
  userRole: string;
}

export function UsersContent({ users: initialUsers, departments, teams, userRole }: UsersContentProps) {
  const { data: session } = useSession();
  const [language, setLanguage] = useState<Language>('pt');
  const [users, setUsers] = useState(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'byRole' | 'byDepartment'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Primeiro tenta ler do localStorage (persistência local)
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      // Fallback para a sessão se não houver no localStorage
      const sessionLang = session.user.language as Language;
      setLanguage(sessionLang);
      localStorage.setItem('userLanguage', sessionLang);
    }
  }, [session]);

  useEffect(() => {
    let filtered = users.filter(user =>
      user?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      user?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ||
      user?.role?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '')
    );

    // Apply role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Apply department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(user => user.department?.id === selectedDepartment);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, selectedDepartment]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleViewUser = (userId: string) => {
    setViewingUserId(userId);
    setIsDetailsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setResettingUser(user);
    setIsResetPasswordModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(getTranslation('delete', language) + '?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user?.id !== userId));
        toast({
          title: language === 'pt' ? 'Utilizador eliminado' : 'User deleted',
          description: language === 'pt' ? 'Utilizador eliminado com sucesso' : 'User deleted successfully',
        });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao eliminar utilizador' : 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleUserSaved = (savedUser: any) => {
    if (editingUser) {
      setUsers(users.map(user => user?.id === savedUser.id ? savedUser : user));
    } else {
      setUsers([savedUser, ...users]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
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
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-primary/10 text-blue-800';
      case 'SUPERVISOR':
        return 'bg-green-100 text-green-800';
      case 'STAFF':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  // Group users by role
  const usersByRole = {
    ADMIN: filteredUsers.filter(u => u.role === 'ADMIN'),
    MANAGER: filteredUsers.filter(u => u.role === 'MANAGER'),
    SUPERVISOR: filteredUsers.filter(u => u.role === 'SUPERVISOR'),
    STAFF: filteredUsers.filter(u => u.role === 'STAFF'),
  };

  // Group users by department
  const usersByDepartment = departments.reduce((acc, dept) => {
    acc[dept.id] = filteredUsers.filter(u => u.department?.id === dept.id);
    return acc;
  }, {} as Record<string, User[]>);

  const usersWithoutDepartment = filteredUsers.filter(u => !u.department);

  const renderUserCard = (user: User) => (
    <motion.div
      key={user?.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewUser(user?.id)}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">
                  {user?.name || user?.email}
                </h3>
                <Badge className={getRoleBadgeColor(user?.role)}>
                  {getRoleTranslation(user?.role)}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-2">{user?.email}</p>
              <div className="flex flex-wrap gap-2 text-sm">
                {user?.department && (
                  <Badge variant="secondary" className="font-normal">
                    <Building2 className="h-3 w-3 mr-1" />
                    {user.department.name}
                  </Badge>
                )}
                {user?.team && (
                  <Badge variant="outline" className="font-normal">
                    <UsersIcon className="h-3 w-3 mr-1" />
                    {user.team.name}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewUser(user?.id)}
                className="gap-2"
                title={language === 'pt' ? 'Ver detalhes' : 'View details'}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditUser(user)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetPassword(user)}
                  className="gap-2 text-orange-600 hover:text-orange-700"
                  title={language === 'pt' ? 'Redefinir senha' : 'Reset password'}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
              )}
              {userRole === 'ADMIN' && user?.role !== 'ADMIN' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user?.id)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderUsersList = (usersList: User[]) => (
    <>
      {usersList?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'pt' ? 'Nenhum utilizador encontrado' : 'No users found'}
            </h3>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4"
        >
          {usersList?.map(renderUserCard)}
        </motion.div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackRoute="/dashboard" variant="ghost" />
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UsersIcon className="h-8 w-8" />
            {getTranslation('users', language)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'pt' ? 'Gerir utilizadores da empresa' : 'Manage company users'}
          </p>
        </div>
        <Button onClick={handleCreateUser} className="gap-2">
          <Plus className="h-4 w-4" />
          {getTranslation('newUser', language)}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'pt' ? 'Pesquisar utilizadores...' : 'Search users...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {language === 'pt' ? 'Filtrar por Cargo' : 'Filter by Role'}
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'pt' ? 'Todos os Cargos' : 'All Roles'}
                  </SelectItem>
                  <SelectItem value="ADMIN">{getTranslation('admin', language)}</SelectItem>
                  <SelectItem value="MANAGER">{getTranslation('manager', language)}</SelectItem>
                  <SelectItem value="SUPERVISOR">{getTranslation('supervisor', language)}</SelectItem>
                  <SelectItem value="STAFF">{getTranslation('staff', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {language === 'pt' ? 'Filtrar por Departamento' : 'Filter by Department'}
              </label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'pt' ? 'Todos os Departamentos' : 'All Departments'}
                  </SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            {language === 'pt' ? 'Todos' : 'All'}
          </TabsTrigger>
          <TabsTrigger value="byRole" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {language === 'pt' ? 'Por Cargo' : 'By Role'}
          </TabsTrigger>
          <TabsTrigger value="byDepartment" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {language === 'pt' ? 'Por Departamento' : 'By Department'}
          </TabsTrigger>
        </TabsList>

        {/* All Users View */}
        <TabsContent value="all" className="mt-6">
          {renderUsersList(filteredUsers)}
        </TabsContent>

        {/* By Role View */}
        <TabsContent value="byRole" className="mt-6 space-y-6">
          {Object.entries(usersByRole).map(([role, roleUsers]) => (
            roleUsers.length > 0 && (
              <div key={role}>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    {getRoleTranslation(role)}
                  </h2>
                  <Badge variant="outline" className="ml-2">
                    {roleUsers.length}
                  </Badge>
                </div>
                <div className="grid gap-4">
                  {roleUsers.map(renderUserCard)}
                </div>
              </div>
            )
          ))}
        </TabsContent>

        {/* By Department View */}
        <TabsContent value="byDepartment" className="mt-6 space-y-6">
          {departments.map(dept => {
            const deptUsers = usersByDepartment[dept.id];
            return deptUsers?.length > 0 && (
              <div key={dept.id}>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    {dept.name}
                  </h2>
                  <Badge variant="outline" className="ml-2">
                    {deptUsers.length}
                  </Badge>
                </div>
                <div className="grid gap-4">
                  {deptUsers.map(renderUserCard)}
                </div>
              </div>
            );
          })}
          {usersWithoutDepartment.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">
                  {language === 'pt' ? 'Sem Departamento' : 'No Department'}
                </h2>
                <Badge variant="outline" className="ml-2">
                  {usersWithoutDepartment.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {usersWithoutDepartment.map(renderUserCard)}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* User Modal */}
      {isModalOpen && (
        <UserModal
          user={editingUser}
          departments={departments}
          teams={teams}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onSaved={handleUserSaved}
          language={language}
        />
      )}

      {/* User Details Modal */}
      {isDetailsModalOpen && viewingUserId && (
        <UserDetailsModal
          userId={viewingUserId}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setViewingUserId(null);
          }}
          language={language}
        />
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() => {
            setIsResetPasswordModalOpen(false);
            setResettingUser(null);
          }}
          onSuccess={() => {
            setIsResetPasswordModalOpen(false);
            setResettingUser(null);
          }}
          language={language}
        />
      )}
    </div>
  );
    }
