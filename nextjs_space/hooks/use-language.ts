
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Language } from '@/lib/i18n';

/**
 * Hook personalizado para gerenciar o idioma com persistência no localStorage
 * Este hook garante que o idioma escolhido seja mantido entre navegações
 */
export function useLanguage() {
  const { data: session } = useSession();
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    // Primeiro tenta ler do localStorage (cache local para persistência imediata)
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else if (session?.user?.language) {
      // Fallback para a sessão se não houver no localStorage
      const sessionLang = session.user.language as Language;
      setLanguageState(sessionLang);
      localStorage.setItem('userLanguage', sessionLang);
    }
  }, [session]);

  return language;
}
