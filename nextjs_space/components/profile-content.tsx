
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getTranslation, Language } from '@/lib/i18n';
import { User, Building2, Calendar, Loader2, Briefcase, Phone, MapPin, CreditCard, UserCircle, AlertCircle } from 'lucide-react';
import { BackButton } from './back-button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ProfilePhotoUploader } from './profile-photo-uploader';

interface CompanyData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  defaultLanguage?: string | null;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  language: string;
  createdAt: string;
  
  // Personal data
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  birthDate?: string | null;
  taxId?: string | null;
  
  // Professional data
  employeeNumber?: string | null;
  hireDate?: string | null;
  jobTitle?: string | null;
  
  // Emergency contact
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  
  company: CompanyData;
  department: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
    department: {
      name: string;
    };
  } | null;
}

interface ProfileContentProps {
  user: UserProfile;
}

export function ProfileContent({ user: initialUser }: ProfileContentProps) {
  const { data: session, update } = useSession();
  const [language, setLanguage] = useState<Language>('pt');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  
  const [personalData, setPersonalData] = useState({
    name: initialUser?.name || '',
    email: initialUser?.email || '',
    phone: initialUser?.phone || '',
    address: initialUser?.address || '',
    city: initialUser?.city || '',
    state: initialUser?.state || '',
    country: initialUser?.country || '',
    postalCode: initialUser?.postalCode || '',
    birthDate: initialUser?.birthDate ? new Date(initialUser.birthDate).toISOString().split('T')[0] : '',
    taxId: initialUser?.taxId || '',
  });
  
  const [professionalData, setProfessionalData] = useState({
    employeeNumber: initialUser?.employeeNumber || '',
    hireDate: initialUser?.hireDate ? new Date(initialUser.hireDate).toISOString().split('T')[0] : '',
    jobTitle: initialUser?.jobTitle || '',
    departmentId: initialUser?.department?.id || '',
  });

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  
  const [emergencyData, setEmergencyData] = useState({
    emergencyContactName: initialUser?.emergencyContactName || '',
    emergencyContactPhone: initialUser?.emergencyContactPhone || '',
    emergencyContactRelation: initialUser?.emergencyContactRelation || '',
  });
  
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
    // Fetch departments
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedUser.name,
            email: updatedUser.email,
          },
        });

        setIsEditingPersonal(false);
        toast({
          title: language === 'pt' ? 'Dados atualizados' : 'Data updated',
          description: language === 'pt' ? 'Dados pessoais atualizados com sucesso' : 'Personal data updated successfully',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao atualizar dados' : 'Failed to update data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(professionalData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser({
          ...updatedUser,
          createdAt: updatedUser.createdAt,
          birthDate: updatedUser.birthDate,
          hireDate: updatedUser.hireDate,
        });

        setIsEditingProfessional(false);
        toast({
          title: language === 'pt' ? 'Dados atualizados' : 'Data updated',
          description: language === 'pt' ? 'Dados profissionais atualizados com sucesso' : 'Professional data updated successfully',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao atualizar dados' : 'Failed to update data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);

        setIsEditingEmergency(false);
        toast({
          title: language === 'pt' ? 'Dados atualizados' : 'Data updated',
          description: language === 'pt' ? 'Contacto de emergência atualizado com sucesso' : 'Emergency contact updated successfully',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao atualizar contacto' : 'Failed to update contact',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackRoute="/dashboard" variant="ghost" />
          </div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            {getTranslation('profile', language)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'pt' ? 'Gerir informações do perfil' : 'Manage profile information'}
          </p>
        </div>
      </div>

      {/* Profile Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              {language === 'pt' ? 'Foto de Perfil' : 'Profile Picture'}
            </CardTitle>
            <CardDescription>
              {language === 'pt' ? 'Carregue a sua foto de perfil' : 'Upload your profile picture'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfilePhotoUploader />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              {language === 'pt' ? 'Dados Pessoais' : 'Personal Data'}
            </TabsTrigger>
            <TabsTrigger value="professional">
              <Briefcase className="h-4 w-4 mr-2" />
              {language === 'pt' ? 'Dados Profissionais' : 'Professional Data'}
            </TabsTrigger>
            <TabsTrigger value="emergency">
              <AlertCircle className="h-4 w-4 mr-2" />
              {language === 'pt' ? 'Emergência' : 'Emergency'}
            </TabsTrigger>
          </TabsList>

          {/* Personal Data Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'pt' ? 'Informações Pessoais' : 'Personal Information'}</CardTitle>
                <CardDescription>
                  {language === 'pt' ? 'Edite as suas informações pessoais' : 'Edit your personal information'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingPersonal ? (
                  <form onSubmit={handleSavePersonal} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">{getTranslation('name', language)}</Label>
                        <Input
                          id="name"
                          value={personalData.name}
                          onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">{getTranslation('email', language)}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={personalData.email}
                          onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">
                          <Phone className="h-4 w-4 inline mr-1" />
                          {language === 'pt' ? 'Telemóvel' : 'Phone'}
                        </Label>
                        <Input
                          id="phone"
                          value={personalData.phone}
                          onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                          placeholder="+351 912 345 678"
                        />
                      </div>

                      <div>
                        <Label htmlFor="birthDate">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {language === 'pt' ? 'Data de Nascimento' : 'Birth Date'}
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={personalData.birthDate}
                          onChange={(e) => setPersonalData({ ...personalData, birthDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="taxId">
                          <CreditCard className="h-4 w-4 inline mr-1" />
                          {language === 'pt' ? 'NIF / CPF' : 'Tax ID'}
                        </Label>
                        <Input
                          id="taxId"
                          value={personalData.taxId}
                          onChange={(e) => setPersonalData({ ...personalData, taxId: e.target.value })}
                          placeholder={language === 'pt' ? '123456789' : 'Tax ID'}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {language === 'pt' ? 'Endereço' : 'Address'}
                      </h4>
                      
                      <div>
                        <Label htmlFor="address">{language === 'pt' ? 'Rua / Avenida' : 'Street'}</Label>
                        <Input
                          id="address"
                          value={personalData.address}
                          onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                          placeholder={language === 'pt' ? 'Rua Principal, 123' : 'Main Street, 123'}
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">{language === 'pt' ? 'Cidade' : 'City'}</Label>
                          <Input
                            id="city"
                            value={personalData.city}
                            onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="state">{language === 'pt' ? 'Estado / Região' : 'State / Region'}</Label>
                          <Input
                            id="state"
                            value={personalData.state}
                            onChange={(e) => setPersonalData({ ...personalData, state: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="postalCode">{language === 'pt' ? 'Código Postal' : 'Postal Code'}</Label>
                          <Input
                            id="postalCode"
                            value={personalData.postalCode}
                            onChange={(e) => setPersonalData({ ...personalData, postalCode: e.target.value })}
                            placeholder="1000-001"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="country">{language === 'pt' ? 'País' : 'Country'}</Label>
                        <Input
                          id="country"
                          value={personalData.country}
                          onChange={(e) => setPersonalData({ ...personalData, country: e.target.value })}
                          placeholder={language === 'pt' ? 'Portugal' : 'Country'}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? getTranslation('loading', language) : getTranslation('save', language)}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingPersonal(false)}
                      >
                        {getTranslation('cancel', language)}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">{getTranslation('name', language)}</Label>
                        <p className="text-foreground font-medium">{user?.name || '-'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">{getTranslation('email', language)}</Label>
                        <p className="text-foreground">{user?.email}</p>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {language === 'pt' ? 'Telemóvel' : 'Phone'}
                        </Label>
                        <p className="text-foreground">{user?.phone || '-'}</p>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {language === 'pt' ? 'Data de Nascimento' : 'Birth Date'}
                        </Label>
                        <p className="text-foreground">{formatDate(user?.birthDate)}</p>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {language === 'pt' ? 'NIF / CPF' : 'Tax ID'}
                        </Label>
                        <p className="text-foreground">{user?.taxId || '-'}</p>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">{getTranslation('role', language)}</Label>
                        <div className="mt-1">
                          <Badge className="bg-primary/10 text-blue-800">
                            {getRoleTranslation(user?.role)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {(user?.address || user?.city || user?.state || user?.country || user?.postalCode) && (
                      <div className="pt-4 border-t">
                        <Label className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3" />
                          {language === 'pt' ? 'Endereço' : 'Address'}
                        </Label>
                        <div className="text-foreground space-y-1">
                          {user?.address && <p>{user.address}</p>}
                          <p>
                            {[user?.postalCode, user?.city].filter(Boolean).join(' ')}
                          </p>
                          <p>
                            {[user?.state, user?.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    <Button onClick={() => setIsEditingPersonal(true)}>
                      {getTranslation('edit', language)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Data Tab */}
          <TabsContent value="professional">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'pt' ? 'Dados Profissionais' : 'Professional Data'}</CardTitle>
                <CardDescription>
                  {language === 'pt' ? 'Informações sobre o seu trabalho' : 'Information about your work'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingProfessional ? (
                  <form onSubmit={handleSaveProfessional} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employeeNumber">
                          {language === 'pt' ? 'Número de Funcionário' : 'Employee Number'}
                        </Label>
                        <Input
                          id="employeeNumber"
                          value={professionalData.employeeNumber}
                          onChange={(e) => setProfessionalData({ ...professionalData, employeeNumber: e.target.value })}
                          placeholder="EMP-001"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hireDate">
                          {language === 'pt' ? 'Data de Admissão' : 'Hire Date'}
                        </Label>
                        <Input
                          id="hireDate"
                          type="date"
                          value={professionalData.hireDate}
                          onChange={(e) => setProfessionalData({ ...professionalData, hireDate: e.target.value })}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="jobTitle">
                          {language === 'pt' ? 'Cargo' : 'Job Title'}
                        </Label>
                        <Input
                          id="jobTitle"
                          value={professionalData.jobTitle}
                          onChange={(e) => setProfessionalData({ ...professionalData, jobTitle: e.target.value })}
                          placeholder={language === 'pt' ? 'Ex: Gestor de Projetos' : 'Ex: Project Manager'}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="departmentId">
                          <Building2 className="h-4 w-4 inline mr-1" />
                          {getTranslation('department', language)}
                        </Label>
                        <Select
                          value={professionalData.departmentId || 'none'}
                          onValueChange={(value) => setProfessionalData({ ...professionalData, departmentId: value === 'none' ? '' : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'pt' ? 'Selecione o departamento' : 'Select department'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              {language === 'pt' ? 'Sem departamento' : 'No department'}
                            </SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold flex items-center gap-2 mb-4">
                        <Building2 className="h-4 w-4" />
                        {language === 'pt' ? 'Informações da Empresa' : 'Company Information'}
                      </h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">{language === 'pt' ? 'Empresa' : 'Company'}</Label>
                          <p className="text-foreground font-medium">{user?.company?.name}</p>
                        </div>

                        {user?.department && (
                          <div>
                            <Label className="text-sm text-muted-foreground">{getTranslation('department', language)}</Label>
                            <p className="text-foreground">{user.department.name}</p>
                          </div>
                        )}

                        {user?.team && (
                          <div>
                            <Label className="text-sm text-muted-foreground">{getTranslation('team', language)}</Label>
                            <p className="text-foreground">{user.team.name}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? getTranslation('loading', language) : getTranslation('save', language)}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingProfessional(false)}
                      >
                        {getTranslation('cancel', language)}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Número de Funcionário' : 'Employee Number'}
                        </Label>
                        <p className="text-foreground font-medium">{user?.employeeNumber || '-'}</p>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Data de Admissão' : 'Hire Date'}
                        </Label>
                        <p className="text-foreground">{formatDate(user?.hireDate)}</p>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-sm text-muted-foreground">
                          {language === 'pt' ? 'Cargo' : 'Job Title'}
                        </Label>
                        <p className="text-foreground">{user?.jobTitle || '-'}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold flex items-center gap-2 mb-4">
                        <Building2 className="h-4 w-4" />
                        {language === 'pt' ? 'Informações da Empresa' : 'Company Information'}
                      </h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">{language === 'pt' ? 'Empresa' : 'Company'}</Label>
                          <p className="text-foreground font-medium">{user?.company?.name}</p>
                        </div>

                        {user?.department && (
                          <div>
                            <Label className="text-sm text-muted-foreground">{getTranslation('department', language)}</Label>
                            <p className="text-foreground">{user.department.name}</p>
                          </div>
                        )}

                        {user?.team && (
                          <div>
                            <Label className="text-sm text-muted-foreground">{getTranslation('team', language)}</Label>
                            <p className="text-foreground">{user.team.name}</p>
                          </div>
                        )}

                        <div>
                          <Label className="text-sm text-muted-foreground">{getTranslation('role', language)}</Label>
                          <div className="mt-1">
                            <Badge className="bg-primary/10 text-blue-800">
                              {getRoleTranslation(user?.role)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button onClick={() => setIsEditingProfessional(true)}>
                      {getTranslation('edit', language)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Contact Tab */}
          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  {language === 'pt' ? 'Contacto de Emergência' : 'Emergency Contact'}
                </CardTitle>
                <CardDescription>
                  {language === 'pt' 
                    ? 'Informação de contacto em caso de emergência' 
                    : 'Contact information in case of emergency'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingEmergency ? (
                  <form onSubmit={handleSaveEmergency} className="space-y-4">
                    <div>
                      <Label htmlFor="emergencyContactName">
                        {language === 'pt' ? 'Nome do Contacto' : 'Contact Name'}
                      </Label>
                      <Input
                        id="emergencyContactName"
                        value={emergencyData.emergencyContactName}
                        onChange={(e) => setEmergencyData({ ...emergencyData, emergencyContactName: e.target.value })}
                        placeholder={language === 'pt' ? 'Nome completo' : 'Full name'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergencyContactPhone">
                        <Phone className="h-4 w-4 inline mr-1" />
                        {language === 'pt' ? 'Número de Telefone' : 'Phone Number'}
                      </Label>
                      <Input
                        id="emergencyContactPhone"
                        value={emergencyData.emergencyContactPhone}
                        onChange={(e) => setEmergencyData({ ...emergencyData, emergencyContactPhone: e.target.value })}
                        placeholder="+351 912 345 678"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergencyContactRelation">
                        {language === 'pt' ? 'Relação' : 'Relationship'}
                      </Label>
                      <Input
                        id="emergencyContactRelation"
                        value={emergencyData.emergencyContactRelation}
                        onChange={(e) => setEmergencyData({ ...emergencyData, emergencyContactRelation: e.target.value })}
                        placeholder={language === 'pt' ? 'Ex: Cônjuge, Familiar, Amigo' : 'Ex: Spouse, Family, Friend'}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? getTranslation('loading', language) : getTranslation('save', language)}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingEmergency(false)}
                      >
                        {getTranslation('cancel', language)}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {!user?.emergencyContactName && !user?.emergencyContactPhone && !user?.emergencyContactRelation ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>
                          {language === 'pt' 
                            ? 'Nenhum contacto de emergência configurado' 
                            : 'No emergency contact configured'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            {language === 'pt' ? 'Nome do Contacto' : 'Contact Name'}
                          </Label>
                          <p className="text-foreground font-medium">{user?.emergencyContactName || '-'}</p>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {language === 'pt' ? 'Número de Telefone' : 'Phone Number'}
                          </Label>
                          <p className="text-foreground">{user?.emergencyContactPhone || '-'}</p>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">
                            {language === 'pt' ? 'Relação' : 'Relationship'}
                          </Label>
                          <p className="text-foreground">{user?.emergencyContactRelation || '-'}</p>
                        </div>
                      </div>
                    )}

                    <Button onClick={() => setIsEditingEmergency(true)}>
                      {user?.emergencyContactName 
                        ? getTranslation('edit', language) 
                        : (language === 'pt' ? 'Adicionar Contacto' : 'Add Contact')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
    }
