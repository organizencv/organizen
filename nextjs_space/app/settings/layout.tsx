
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SettingsNavigation } from '@/components/settings/SettingsNavigation';
import { useToast } from '@/hooks/use-toast';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Verificar se o usuário é ADMIN
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem acessar as configurações.',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [session, status, router, toast]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Navegação Lateral */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-8 lg:self-start">
            <SettingsNavigation currentPath={pathname} />
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
