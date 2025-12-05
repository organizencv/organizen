'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ReportsContent from '@/components/reports-content';
import ReportsAttendanceContent from '@/components/reports-attendance-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { getTranslation } from '@/lib/i18n';
import { BarChart3, Clock } from 'lucide-react';

export default function ReportsPage() {
  const { data: session } = useSession() || {};
  const lang = ((session?.user as any)?.language || 'pt') as 'pt' | 'en' | 'es' | 'fr';
  const t = (key: any) => getTranslation(key, lang);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('reports')}
        showBackButton
        backUrl="/dashboard"
      />
      
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('attendance')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <ReportsContent />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <ReportsAttendanceContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
