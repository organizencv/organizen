
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Sparkles, 
  Mail, 
  Building2, 
  Users, 
  Shield, 
  CheckSquare,
  Bell, 
  Calendar,
  CreditCard,
  Puzzle,
  Database,
  User,
  ChevronRight,
  Monitor,
  MessageSquareQuote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SettingsNavigationProps {
  currentPath: string;
}

export function SettingsNavigation({ currentPath }: SettingsNavigationProps) {
  const navigationItems = [
    {
      id: 'overview',
      title: 'Visão Geral',
      href: '/settings',
      icon: Settings,
      available: true,
    },
    {
      id: 'branding',
      title: 'Branding',
      href: '/settings/branding',
      icon: Sparkles,
      available: true,
      badge: 'Pro+',
    },
    {
      id: 'email-templates',
      title: 'Email Templates',
      href: '/settings/email-templates',
      icon: Mail,
      available: true,
      badge: 'Pro+',
    },
    {
      id: 'company',
      title: 'Empresa',
      href: '/settings/company',
      icon: Building2,
      available: true,
    },
    {
      id: 'departments',
      title: 'Departamentos',
      href: '/settings/departments',
      icon: Building2,
      available: true,
    },
    {
      id: 'users',
      title: 'Utilizadores',
      href: '/settings/users',
      icon: Users,
      available: false,
    },
    {
      id: 'security',
      title: 'Segurança',
      href: '/settings/security',
      icon: Shield,
      available: true,
    },
    {
      id: 'sessions',
      title: 'Sessões',
      href: '/settings/sessions',
      icon: Monitor,
      available: true,
    },
    {
      id: 'tasks',
      title: 'Tarefas',
      href: '/settings/tasks',
      icon: CheckSquare,
      available: true,
    },
    {
      id: 'notifications',
      title: 'Notificações',
      href: '/settings/notifications',
      icon: Bell,
      available: true,
    },
    {
      id: 'testimonials',
      title: 'Testemunhos',
      href: '/settings/testimonials',
      icon: MessageSquareQuote,
      available: true,
    },
    {
      id: 'calendar',
      title: 'Calendário',
      href: '/settings/calendar',
      icon: Calendar,
      available: true,
    },
    {
      id: 'billing',
      title: 'Faturação',
      href: '/settings/billing',
      icon: CreditCard,
      available: false,
    },
    {
      id: 'integrations',
      title: 'Integrações',
      href: '/settings/integrations',
      icon: Puzzle,
      available: false,
    },
    {
      id: 'backup',
      title: 'Backup',
      href: '/settings/backup',
      icon: Database,
      available: false,
    },
    {
      id: 'personal',
      title: 'Pessoal',
      href: '/settings/personal',
      icon: User,
      available: false,
    },
  ];

  const availableItems = navigationItems.filter(item => item.available);
  const upcomingItems = navigationItems.filter(item => !item.available);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3">
        {/* Items Disponíveis */}
        {availableItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && !isActive && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
                {isActive && <ChevronRight className="h-4 w-4" />}
              </div>
            </Link>
          );
        })}

        {upcomingItems.length > 0 && (
          <>
            <Separator className="my-3" />
            
            {/* Items Em Breve */}
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Em Breve
            </div>
            
            {upcomingItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}
