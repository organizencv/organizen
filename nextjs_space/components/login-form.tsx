
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Building2, Loader2, HelpCircle, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePublicBranding } from '@/hooks/use-public-branding';
import { getTranslation, Language } from '@/lib/i18n';

interface LoginFormProps {
  onEmailChange?: (email: string) => void;
}

export function LoginForm({ onEmailChange }: LoginFormProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('pt');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  // Buscar idioma salvo no localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Buscar branding baseado no email digitado
  const [companyEmail, setCompanyEmail] = useState<string>();
  const { branding, isLoading: brandingLoading } = usePublicBranding(companyEmail);

  // Detectar domínio da empresa quando o usuário digitar o email
  useEffect(() => {
    if (formData.email && formData.email.includes('@')) {
      const domain = formData.email.split('@')[1];
      if (domain) {
        // Usar o email completo da empresa ou apenas o domínio
        setCompanyEmail(formData.email);
        // Notificar componente pai
        onEmailChange?.(formData.email);
      }
    }
  }, [formData.email, onEmailChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        toast({
          title: getTranslation('loginSuccess', language),
          description: branding?.welcomeMessage || getTranslation('welcomeToOrganiZen', language),
        });
        router.push('/dashboard');
      } else {
        toast({
          title: getTranslation('loginError', language),
          description: getTranslation('incorrectCredentials', language),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation('loginError', language),
        description: getTranslation('errorOccurred', language),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const hasCustomBranding = branding?.hasCustomBranding;
  const primaryColor = branding?.primaryColor || '#3B82F6';

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-xl" style={hasCustomBranding ? {
        borderColor: primaryColor + '30'
      } : undefined}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {hasCustomBranding && branding.logoUrl ? (
              <div className="relative" style={{ 
                width: branding.logoSize || 150, 
                height: branding.logoSize || 150 
              }}>
                <Image
                  src={branding.logoUrl}
                  alt={branding.companyName}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <Building2 className="h-12 w-12" style={hasCustomBranding ? {
                color: primaryColor
              } : undefined} />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {hasCustomBranding && branding.welcomeMessage 
              ? branding.welcomeMessage 
              : getTranslation('login', language)}
          </CardTitle>
          <CardDescription>
            {hasCustomBranding && branding.tagline 
              ? branding.tagline 
              : getTranslation('loginToAccount', language)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{getTranslation('email', language)}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={getTranslation('enterYourEmail', language)}
              />
            </div>

            <div>
              <Label htmlFor="password">{getTranslation('password', language)}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder={getTranslation('enterYourPassword', language)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              style={hasCustomBranding ? {
                backgroundColor: primaryColor,
                color: 'white'
              } : undefined}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? getTranslation('loggingIn', language) : getTranslation('login', language)}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{getTranslation('noAccount', language)}</span>
              <Link 
                href="/signup" 
                className="hover:underline ml-2"
                style={hasCustomBranding ? { color: primaryColor } : undefined}
              >
                {getTranslation('registerCompany', language)}
              </Link>
            </div>
          </form>

          {/* Links Personalizados */}
          {hasCustomBranding && (branding.supportLink || branding.termsLink || branding.privacyLink) && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                {branding.supportLink && (
                  <a 
                    href={branding.supportLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <HelpCircle className="h-3 w-3" />
                    {getTranslation('support', language)}
                  </a>
                )}
                {branding.termsLink && (
                  <a 
                    href={branding.termsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <FileText className="h-3 w-3" />
                    {getTranslation('terms', language)}
                  </a>
                )}
                {branding.privacyLink && (
                  <a 
                    href={branding.privacyLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Shield className="h-3 w-3" />
                    {getTranslation('privacy', language)}
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Powered by OrganiZen */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        {hasCustomBranding && branding.companyName && (
          <p className="mb-1">© {new Date().getFullYear()} {branding.companyName}</p>
        )}
        <p>{getTranslation('poweredBy', language)} <span className="font-semibold">OrganiZen</span></p>
      </div>
    </div>
  );
}
