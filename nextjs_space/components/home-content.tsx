
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LanguageSwitcher } from './language-switcher';
import { getTranslation, Language } from '@/lib/i18n';
import { Building2, Users, Clock, CheckSquare } from 'lucide-react';

export function HomeContent() {
  const [language, setLanguage] = useState<Language>('pt');

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher 
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Building2 className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {getTranslation('appTitle', language)}
            </h1>
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto font-medium">
            {getTranslation('appSubtitle', language)}
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
            {getTranslation('appDescription', language)}
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>
                {getTranslation('hierarchicalManagement', language)}
              </CardTitle>
              <CardDescription>
                {getTranslation('hierarchicalManagementDesc', language)}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>
                {getTranslation('shiftManagement', language)}
              </CardTitle>
              <CardDescription>
                {getTranslation('shiftManagementDesc', language)}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckSquare className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>
                {getTranslation('taskSystem', language)}
              </CardTitle>
              <CardDescription>
                {getTranslation('taskSystemDesc', language)}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>
                {getTranslation('getStarted', language)}
              </CardTitle>
              <CardDescription>
                {getTranslation('getStartedDesc', language)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/signup" className="w-full">
                <Button className="w-full" size="lg">
                  {getTranslation('signup', language)}
                </Button>
              </Link>
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {getTranslation('alreadyHaveAccount', language)}
                </span>
                <Link href="/login" className="text-sm text-primary hover:underline ml-2 font-medium">
                  {getTranslation('login', language)}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600 dark:text-gray-300">
          <p>
            {getTranslation('intuitiveInterface', language)}
          </p>
          <p className="mt-2">
            {getTranslation('languageSupport', language)}
          </p>
        </div>
      </div>
    </div>
  );
}
