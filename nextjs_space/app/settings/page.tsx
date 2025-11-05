
'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  Mail, 
  Building2, 
  Users, 
  Shield, 
  Bell, 
  Calendar,
  CreditCard,
  Puzzle,
  Database,
  User,
  ArrowRight,
  Info,
  Globe,
  Monitor,
  CheckSquare,
  MessageSquare,
  Cake
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BackButton } from '@/components/back-button';

export default function SettingsPage() {
  const { data: session } = useSession() || {};

  const settingsSections = [
    {
      id: 'company',
      title: 'Empresa',
      description: 'Nome, endereço, contatos e dados corporativos',
      icon: Building2,
      href: '/settings/company',
      available: true,
    },
    {
      id: 'regional',
      title: 'Configurações Regionais',
      description: 'Fuso horário, formato de data/hora e moeda',
      icon: Globe,
      href: '/settings/regional',
      available: true,
    },
    {
      id: 'branding',
      title: 'Branding',
      description: 'Personalize logotipo, cores e identidade visual',
      icon: Sparkles,
      href: '/settings/branding',
      available: true,
      badge: 'Pro+',
    },
    {
      id: 'email-templates',
      title: 'Email Templates',
      description: 'Configure emails personalizados do sistema',
      icon: Mail,
      href: '/settings/email-templates',
      available: true,
      badge: 'Pro+',
    },
    {
      id: 'security',
      title: 'Segurança',
      description: 'Autenticação, passwords e logs de auditoria',
      icon: Shield,
      href: '/settings/security',
      available: true,
    },
    {
      id: 'sessions',
      title: 'Sessões',
      description: 'Gerir sessões ativas e histórico de acessos',
      icon: Monitor,
      href: '/settings/sessions',
      available: true,
    },
    {
      id: 'tasks',
      title: 'Tarefas',
      description: 'Status, prioridades e tags personalizadas',
      icon: CheckSquare,
      href: '/settings/tasks',
      available: true,
    },
    {
      id: 'notifications',
      title: 'Notificações',
      description: 'Configure alertas, emails e preferências',
      icon: Bell,
      href: '/settings/notifications',
      available: true,
    },
    {
      id: 'testimonials',
      title: 'Testemunhos',
      description: 'Gerir testemunhos e depoimentos de colaboradores',
      icon: MessageSquare,
      href: '/settings/testimonials',
      available: true,
    },
    {
      id: 'birthdays',
      title: 'Aniversários',
      description: 'Configurar celebrações automáticas de aniversários',
      icon: Cake,
      href: '/settings/birthdays',
      available: true,
    },
    {
      id: 'users',
      title: 'Utilizadores',
      description: 'Gerir utilizadores, funções e políticas de acesso',
      icon: Users,
      href: '/settings/users',
      available: false,
      badge: 'Em breve',
    },
    {
      id: 'calendar',
      title: 'Calendário',
      description: 'Feriados, horários e integrações',
      icon: Calendar,
      href: '/settings/calendar',
      available: false,
      badge: 'Em breve',
    },
    {
      id: 'billing',
      title: 'Faturação e Plano',
      description: 'Subscrição, histórico e métodos de pagamento',
      icon: CreditCard,
      href: '/settings/billing',
      available: false,
      badge: 'Em breve',
    },
    {
      id: 'integrations',
      title: 'Integrações',
      description: 'Conecte com ferramentas externas (Slack, Drive, etc)',
      icon: Puzzle,
      href: '/settings/integrations',
      available: false,
      badge: 'Em breve',
    },
    {
      id: 'backup',
      title: 'Backup e Recuperação',
      description: 'Exportar, importar e restaurar dados',
      icon: Database,
      href: '/settings/backup',
      available: false,
      badge: 'Em breve',
    },
    {
      id: 'personal',
      title: 'Preferências Pessoais',
      description: 'Idioma, fuso horário e notificações pessoais',
      icon: User,
      href: '/settings/personal',
      available: false,
      badge: 'Em breve',
    },
  ];

  const availableSections = settingsSections.filter(s => s.available);
  const upcomingSections = settingsSections.filter(s => !s.available);

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>
        <p className="text-muted-foreground">
          Gerir todas as configurações do sistema OrganiZen
        </p>
      </div>

      {/* Informação do Utilizador */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          A gerir como <strong>{session?.user?.name}</strong> ({session?.user?.email}) - 
          Função: <strong>{session?.user?.role}</strong>
        </AlertDescription>
      </Alert>

      {/* Secções Disponíveis */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Funcionalidades Disponíveis</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {availableSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.id} href={section.href}>
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {section.title}
                          </CardTitle>
                        </div>
                      </div>
                      {section.badge && (
                        <Badge variant="secondary" className="shrink-0">
                          {section.badge}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10">
                      Configurar
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Secções Em Breve */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Em Desenvolvimento</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {section.title}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {section.badge}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2 text-sm">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
