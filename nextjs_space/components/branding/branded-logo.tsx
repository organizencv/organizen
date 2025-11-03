
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { CompanyBranding } from '@/lib/types';
import { getLogoStyle } from '@/lib/branding/apply-theme';

interface BrandedLogoProps {
  fallback?: React.ReactNode;
  className?: string;
}

export function BrandedLogo({ fallback, className }: BrandedLogoProps) {
  const { data: session, status } = useSession() || {};
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Apenas carregar branding se o usuário estiver autenticado
    if (status === 'loading') return;
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const loadBranding = async () => {
      try {
        const response = await fetch('/api/branding');
        if (response.ok) {
          const data = await response.json();
          console.log('Branding data loaded:', data);
          setBranding(data);
          
          // Se tem logoUrl (chave S3), buscar URL assinada
          if (data.logoUrl) {
            console.log('Fetching signed URL for logo:', data.logoUrl);
            const urlResponse = await fetch(`/api/branding/logo-url?key=${encodeURIComponent(data.logoUrl)}`);
            if (urlResponse.ok) {
              const { url } = await urlResponse.json();
              console.log('Signed URL received:', url);
              setLogoUrl(url);
            } else {
              console.error('Failed to get signed URL:', urlResponse.status);
            }
          } else {
            console.log('No logoUrl in branding data');
          }
        } else {
          console.log('No branding configuration found');
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();
  }, [session, status]);

  if (isLoading) {
    return fallback || <div className={className}>OrganiZen</div>;
  }

  if (!branding?.logoUrl || !branding.isActive || !logoUrl) {
    return fallback || <div className={className}>OrganiZen</div>;
  }

  return (
    <div className={className} style={getLogoStyle(branding)}>
      <Image
        src={logoUrl}
        alt="Logo da empresa"
        fill
        className="object-contain"
        priority
        unoptimized
      />
    </div>
  );
}
