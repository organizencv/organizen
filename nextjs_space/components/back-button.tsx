
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /**
   * Rota alternativa para navegar caso não exista histórico
   */
  fallbackRoute?: string;
  
  /**
   * Label do botão (padrão: "Voltar")
   */
  label?: string;
  
  /**
   * Classe CSS adicional
   */
  className?: string;
  
  /**
   * Variante do botão
   */
  variant?: 'ghost' | 'outline' | 'default' | 'secondary';
  
  /**
   * Mostrar sempre ou só no PWA
   */
  showOnlyInPWA?: boolean;
}

export function BackButton({
  fallbackRoute = '/dashboard',
  label = 'Voltar',
  className,
  variant = 'ghost',
  showOnlyInPWA = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Verificar se existe histórico
    if (window.history.length > 1) {
      router.back();
    } else {
      // Se não houver histórico, navegar para rota alternativa
      router.push(fallbackRoute);
    }
  };

  // Se configurado para mostrar apenas no PWA, verificar
  if (showOnlyInPWA) {
    // Verificar se está rodando como PWA
    const isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    if (!isPWA) {
      return null;
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleBack}
      className={cn('gap-2', className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
