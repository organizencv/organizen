
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/signup-form';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function SignupPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Buscar branding público (pode ser do localStorage)
  useEffect(() => {
    const loadDefaultBranding = async () => {
      try {
        const lastEmail = localStorage.getItem('lastLoginEmail');
        if (lastEmail) {
          const response = await fetch(
            `/api/branding/public?email=${encodeURIComponent(lastEmail)}`
          );
          if (response.ok) {
            const data = await response.json();
            setBranding(data);

            // A API já retorna o URL assinado no campo loginBackgroundImage
            if (data.loginBackgroundImage) {
              setBackgroundUrl(data.loginBackgroundImage);
            }
          }
        }
      } catch (error) {
        console.error('Error loading default branding:', error);
      }
    };

    if (mounted) {
      loadDefaultBranding();
    }
  }, [mounted]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  // Determinar o background baseado nas configurações de branding
  const getBackgroundStyle = () => {
    if (!branding?.hasCustomBranding) {
      return 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800';
    }

    switch (branding.loginBackgroundType) {
      case 'solid':
        return '';
      case 'image':
        return '';
      case 'gradient':
      default:
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800';
    }
  };

  const backgroundClass = getBackgroundStyle();
  const solidColor = branding?.loginBackgroundType === 'solid' 
    ? branding.loginBackgroundColor 
    : null;

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 relative ${backgroundClass}`}
      style={solidColor ? { backgroundColor: solidColor } : undefined}
    >
      {/* Background Image */}
      {branding?.loginBackgroundType === 'image' && backgroundUrl && (
        <>
          <Image
            src={backgroundUrl}
            alt="Background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-black/30" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        <SignupForm />
      </div>
    </div>
  );
}
