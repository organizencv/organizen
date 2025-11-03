
'use client';

import { Button } from './ui/button';
import { Globe } from 'lucide-react';
import { Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const handleLanguageClick = (lang: Language) => {
    console.log('Language button clicked:', lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-border">
      <Globe className="h-4 w-4 text-muted-foreground ml-2" />
      <Button 
        variant={currentLanguage === 'pt' ? 'default' : 'ghost'} 
        size="sm" 
        onClick={() => handleLanguageClick('pt')}
        className="h-7 px-2 text-xs"
        data-testid="language-pt-button"
        aria-label="Mudar para Português"
      >
        PT
      </Button>
      <Button 
        variant={currentLanguage === 'en' ? 'default' : 'ghost'} 
        size="sm" 
        onClick={() => handleLanguageClick('en')}
        className="h-7 px-2 text-xs"
        data-testid="language-en-button"
        aria-label="Switch to English"
      >
        EN
      </Button>
      <Button 
        variant={currentLanguage === 'es' ? 'default' : 'ghost'} 
        size="sm" 
        onClick={() => handleLanguageClick('es')}
        className="h-7 px-2 text-xs"
        data-testid="language-es-button"
        aria-label="Cambiar a Español"
      >
        ES
      </Button>
      <Button 
        variant={currentLanguage === 'fr' ? 'default' : 'ghost'} 
        size="sm" 
        onClick={() => handleLanguageClick('fr')}
        className="h-7 px-2 text-xs mr-1"
        data-testid="language-fr-button"
        aria-label="Changer en Français"
      >
        FR
      </Button>
    </div>
  );
}
