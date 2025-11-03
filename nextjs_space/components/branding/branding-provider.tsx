
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { generateCSSVariables } from '@/lib/branding/apply-theme';
import { CompanyBranding } from '@/lib/types';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() || {};
  const { setTheme } = useTheme();
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Apenas carregar branding se o usuário estiver autenticado
    if (status === 'loading') return;
    if (!session?.user) {
      setIsLoaded(true);
      return;
    }

    const loadBranding = async () => {
      try {
        const response = await fetch('/api/branding');
        if (response.ok) {
          const data = await response.json();
          setBranding(data);
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadBranding();
  }, [session, status]);

  useEffect(() => {
    if (!branding || !isLoaded) return;

    // Aplicar tema do branding ao next-themes
    if (branding.isActive && branding.theme) {
      setTheme(branding.theme);
    }

    // Gerar e injetar CSS variables
    const style = document.createElement('style');
    style.id = 'company-branding';
    style.innerHTML = generateCSSVariables(branding);
    
    // Remover estilo antigo se existir
    const oldStyle = document.getElementById('company-branding');
    if (oldStyle) {
      oldStyle.remove();
    }

    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById('company-branding');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [branding, isLoaded, setTheme]);

  return <>{children}</>;
}
