
import { CompanyBranding } from '@/lib/types';

/**
 * Gera CSS variables a partir das configurações de branding
 */
export function generateCSSVariables(branding: CompanyBranding | null): string {
  if (!branding || !branding.isActive) {
    return '';
  }

  const primaryColor = branding.primaryColor || '#3B82F6';
  const secondaryColor = branding.secondaryColor || '#8B5CF6';
  const accentColor = branding.accentColor || '#10B981';

  // Converter HEX para HSL para as CSS variables do Tailwind
  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '222.2 47.4% 11.2%';

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  return `
    :root {
      --brand-primary: ${primaryColor};
      --brand-secondary: ${secondaryColor};
      --brand-accent: ${accentColor};
    }
    
    /* Aplicar cor primária do branding */
    .dark {
      --primary: ${hexToHSL(primaryColor)};
    }
  `;
}

/**
 * Retorna estilo inline para aplicar logo
 */
export function getLogoStyle(branding: CompanyBranding | null) {
  if (!branding?.logoSize) return {};

  return {
    maxHeight: `${branding.logoSize}px`,
    maxWidth: `${branding.logoSize * 2}px`,
  };
}
