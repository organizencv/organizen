
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Building2, Loader2, HelpCircle, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTranslation, Language } from '@/lib/i18n';

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('pt');
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    fullName: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: getTranslation('companyRegistered', language),
          description: getTranslation('autoLogin', language),
        });

        // Auto login after successful signup
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } else {
        toast({
          title: getTranslation('registrationError', language),
          description: data.error || getTranslation('errorOccurred', language),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation('registrationError', language),
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

  // Signup sempre usa branding padrão do OrganiZen
  const primaryColor = '#3B82F6';

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{getTranslation('signup', language)}</CardTitle>
          <CardDescription>
            {getTranslation('createCompanyAccount', language)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="companyName">{getTranslation('companyName', language)}</Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                placeholder={getTranslation('enterCompanyName', language)}
              />
            </div>

            <div>
              <Label htmlFor="fullName">{getTranslation('fullName', language)}</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder={getTranslation('enterFullName', language)}
              />
            </div>

            <div>
              <Label htmlFor="email">{getTranslation('email', language)}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={getTranslation('enterCompanyEmail', language)}
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
                placeholder={getTranslation('enterSecurePassword', language)}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {getTranslation('minimumCharacters', language)}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? getTranslation('registering', language) : getTranslation('signup', language)}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{getTranslation('alreadyHaveAccount', language)}</span>
              <Link href="/login" className="text-primary hover:underline ml-2">
                {getTranslation('login', language)}
              </Link>
            </div>
          </form>

          {/* Links padrão do OrganiZen */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <a 
                href="https://organizen.com/suporte" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <HelpCircle className="h-3 w-3" />
                {getTranslation('support', language)}
              </a>
              <a 
                href="https://organizen.com/termos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <FileText className="h-3 w-3" />
                {getTranslation('terms', language)}
              </a>
              <a 
                href="https://organizen.com/privacidade" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <Shield className="h-3 w-3" />
                {getTranslation('privacy', language)}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Powered by OrganiZen */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} OrganiZen</p>
        <p className="text-xs mt-1">{getTranslation('multiTenantSystem', language)}</p>
      </div>
    </div>
  );
}
