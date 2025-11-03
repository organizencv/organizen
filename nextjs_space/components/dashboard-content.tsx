
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getTranslation, Language } from '@/lib/i18n';
import { 
  Users, 
  Clock, 
  CheckSquare, 
  AlertCircle,
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardContentProps {
  stats: {
    totalUsers: number;
    totalShifts: number;
    totalTasks: number;
    pendingTasks: number;
  };
  userRole: string;
  userName: string;
}

export function DashboardContent({ stats: initialStats, userRole, userName }: DashboardContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('pt');
  const [stats, setStats] = useState(initialStats);

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

  // Auto-refresh stats every 5 seconds
  useEffect(() => {
    const refreshStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const newStats = await response.json();
          setStats(newStats);
        }
      } catch (error) {
        console.error('Failed to refresh stats:', error);
      }
    };

    // Refresh immediately on mount
    refreshStats();

    // Set up interval for auto-refresh
    const interval = setInterval(refreshStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const statCards = [
    {
      title: getTranslation('totalUsers', language),
      value: stats.totalUsers,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10 dark:bg-primary/20',
      roles: ['ADMIN', 'MANAGER']
    },
    {
      title: getTranslation('totalShifts', language),
      value: stats.totalShifts,
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10 dark:bg-primary/20',
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      title: getTranslation('totalTasks', language),
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10 dark:bg-primary/20',
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    },
    {
      title: getTranslation('pendingTasks', language),
      value: stats.pendingTasks,
      icon: AlertCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10 dark:bg-primary/20',
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
    }
  ].filter(card => card.roles.includes(userRole));

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">
              {getTranslation('welcome', language)}, {userName}!
            </CardTitle>
            <div className="text-primary-foreground/80 text-sm">
              <Badge variant="secondary">
                {getRoleTranslation(userRole)}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Statistics Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1 }}
                    >
                      {stat.value}
                    </motion.span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {getTranslation('quickActions', language)}
            </CardTitle>
            <CardDescription>
              {getTranslation('quickActionsDesc', language)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                <Card 
                  className="p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => router.push('/users')}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium text-foreground">{getTranslation('manageUsers', language)}</h3>
                      <p className="text-sm text-muted-foreground">{getTranslation('manageUsersDesc', language)}</p>
                    </div>
                  </div>
                </Card>
              )}
              
              <Card 
                className="p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push('/shifts')}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium text-foreground">{getTranslation('viewShifts', language)}</h3>
                    <p className="text-sm text-muted-foreground">{getTranslation('viewShiftsDesc', language)}</p>
                  </div>
                </div>
              </Card>
              
              <Card 
                className="p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push('/messages')}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium text-foreground">{getTranslation('viewMessages', language)}</h3>
                    <p className="text-sm text-muted-foreground">{getTranslation('viewMessagesDesc', language)}</p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
    }
