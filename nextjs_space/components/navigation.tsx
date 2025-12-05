
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { LanguageSwitcher } from './language-switcher';
import { NotificationsCenter } from './notifications-center';
import { BrandedLogo } from './branding/branded-logo';
import { ShareButton } from './share-button';
import { PwaInstallButton } from './pwa-install-button';
import { getTranslation, Language } from '@/lib/i18n';
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  MessageSquare,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  RefreshCw,
  BarChart3,
  Calendar,
  Building2,
  FileText,
  UserPlus,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { usePendingUsersCount } from '@/hooks/use-pending-users-count';
import { Badge } from './ui/badge';

export function Navigation() {
  // Version: 2024-10-19 - Força atualização de cache
  const { data: session, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState<Language>('pt');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { count: pendingUsersCount } = usePendingUsersCount();

  // Inicializar idioma do localStorage ou sessão
  useEffect(() => {
    // Primeiro tenta ler do localStorage (cache local)
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      // Fallback para a sessão se não houver no localStorage
      setLanguage(session.user.language as Language);
      localStorage.setItem('userLanguage', session.user.language);
    }
  }, [session]);

  const handleLanguageChange = async (newLanguage: Language) => {
    // Salva imediatamente no localStorage para persistência instantânea
    localStorage.setItem('userLanguage', newLanguage);
    setLanguage(newLanguage);
    
    try {
      // Salva no banco de dados em background
      const response = await fetch('/api/user/language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: newLanguage }),
      });
      
      if (response.ok) {
        // Atualiza a sessão
        await update();
        
        // Recarrega a página para aplicar as traduções
        setTimeout(() => {
          window.location.href = pathname || '/dashboard';
        }, 200);
      }
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    // Reset the refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  if (!session) return null;

  const userRole = session.user?.role || 'STAFF';
  
  const navigationItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: getTranslation('dashboard', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      href: '/dashboard/reports',
      icon: BarChart3,
      label: getTranslation('reports', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR']
    },
    {
      href: '/users',
      icon: Users,
      label: getTranslation('users', language),
      roles: ['ADMIN', 'MANAGER']
    },
    {
      href: '/departments',
      icon: Building2,
      label: getTranslation('departments', language),
      roles: ['ADMIN', 'MANAGER']
    },
    {
      href: '/teams',
      icon: Users,
      label: getTranslation('teams', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      href: '/lista-espera',
      icon: UserPlus,
      label: language === 'pt' ? 'Lista de Espera' : 'Waiting List',
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR']
    },
    {
      href: '/shifts',
      icon: Clock,
      label: getTranslation('shifts', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      href: '/tasks',
      icon: CheckSquare,
      label: getTranslation('tasks', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      href: '/calendar',
      icon: Calendar,
      label: getTranslation('calendar', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      href: '/events',
      icon: Calendar,
      label: getTranslation('events', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      href: '/requests',
      icon: FileText,
      label: getTranslation('requests', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      href: '/messages',
      icon: MessageSquare,
      label: getTranslation('messages', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      href: '/chat',
      icon: MessageCircle,
      label: getTranslation('chat', language),
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    }
  ].filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed left-0 top-0 h-full w-72 bg-card shadow-lg border-r border-border transform transition-transform duration-200 ease-in-out z-40 flex flex-col",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header fixo */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div 
              className="cursor-pointer flex-1"
              onClick={handleRefresh}
              title="Clique para atualizar"
            >
              <BrandedLogo 
                className="relative h-10 mb-1"
                fallback={
                  <h1 className="text-2xl font-bold text-primary hover:text-primary transition-colors">
                    OrganiZen
                  </h1>
                }
              />
            </div>
            <div className="flex items-center gap-1">
              <NotificationsCenter language={language} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
                title="Atualizar dados"
              >
                <RefreshCw className={cn(
                  "h-4 w-4 text-primary",
                  isRefreshing && "animate-spin"
                )} />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <UserAvatar user={session.user} size="md" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">
                {session.user?.name || session.user?.email}
              </div>
              <div className="text-sm text-muted-foreground">
                {getTranslation((userRole?.toLowerCase() || 'staff') as any, language)}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation items com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth">
          <div className="space-y-2 pb-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
          {/* Scroll indicator */}
          <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
        </div>

        {/* Bottom section fixo */}
        <div className="border-t border-border p-6 space-y-4 flex-shrink-0">
          {/* PWA Install Button */}
          <div className="flex justify-end">
            <PwaInstallButton />
          </div>
          
          <LanguageSwitcher 
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
          
          <div className="space-y-2">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <UserAvatar user={session.user} size="sm" />
              {getTranslation('profile', language)}
            </Link>
            
            <ShareButton 
              language={language}
              className="w-full justify-start"
            />
            
            {userRole === 'ADMIN' && (
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="flex-1">{language === 'pt' ? 'Configurações' : 'Settings'}</span>
                {pendingUsersCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingUsersCount}
                  </Badge>
                )}
              </Link>
            )}
            
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              {getTranslation('logout', language)}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
