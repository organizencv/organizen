
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { Loader2, Star } from 'lucide-react';
import Image from 'next/image';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent } from '@/components/ui/card';

interface Testimonial {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  comment: string;
  rating: number;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export default function LoginPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Carregar testemunhos
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials/active?limit=5');
        if (response.ok) {
          const data = await response.json();
          setTestimonials(data);
        }
      } catch (error) {
        console.error('Error loading testimonials:', error);
      }
    };

    if (mounted) {
      loadTestimonials();
    }
  }, [mounted]);

  // Buscar branding público (quando usuário digitar email, o LoginForm vai atualizar)
  // Mas também buscamos um branding padrão da empresa se disponível
  useEffect(() => {
    const loadDefaultBranding = async () => {
      try {
        // Tentar buscar branding do localStorage se houver email salvo
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
      // Background padrão do OrganiZen
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
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Testemunhos - Lado Esquerdo */}
          {testimonials.length > 0 && (
            <div className="hidden md:block space-y-6">
              <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-6">
                O que dizem sobre o OrganiZen
              </h2>
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">
                      &quot;{testimonial.comment}&quot;
                    </p>
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        user={testimonial.user || { name: testimonial.name, email: null, image: null }}
                        size="md"
                        publicMode={true}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">
                          {testimonial.jobTitle} na {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Formulário de Login - Lado Direito */}
          <div className={testimonials.length === 0 ? 'md:col-span-2 mx-auto' : ''}>
            <LoginForm onEmailChange={(email) => {
              // Salvar último email para próxima vez
              if (email && email.includes('@')) {
                localStorage.setItem('lastLoginEmail', email);
              }
            }} />
          </div>
        </div>

        {/* Testemunhos Mobile - Abaixo do formulário */}
        {testimonials.length > 0 && (
          <div className="md:hidden mt-8 space-y-4">
            <h3 className="text-xl font-bold text-white drop-shadow-lg text-center mb-4">
              O que dizem sobre o OrganiZen
            </h3>
            {testimonials.slice(0, 2).map((testimonial) => (
              <Card key={testimonial.id} className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < testimonial.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-3 italic">
                    &quot;{testimonial.comment}&quot;
                  </p>
                  <div className="flex items-center gap-2">
                    <UserAvatar 
                      user={testimonial.user || { name: testimonial.name, email: null, image: null }}
                      size="sm"
                      publicMode={true}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-600">
                        {testimonial.jobTitle}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
