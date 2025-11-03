
'use client';

import { useEffect, useState } from 'react';

interface PublicBranding {
  hasCustomBranding: boolean;
  companyName: string;
  logoUrl?: string | null;
  logoSize?: number;
  primaryColor?: string;
  secondaryColor?: string | null;
  accentColor?: string | null;
  loginBackgroundType?: string;
  loginBackgroundImage?: string | null;
  loginBackgroundColor?: string | null;
  welcomeMessage?: string | null;
  tagline?: string | null;
  supportLink?: string | null;
  termsLink?: string | null;
  privacyLink?: string | null;
}

export function usePublicBranding(companyEmail?: string) {
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      if (!companyEmail) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/branding/public?email=${encodeURIComponent(companyEmail)}`
        );
        if (response.ok) {
          const data = await response.json();
          setBranding(data);
        }
      } catch (error) {
        console.error('Error loading public branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();
  }, [companyEmail]);

  return { branding, isLoading };
}
