'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskStatusManager } from '@/components/settings/TaskStatusManager';
import { TaskTagManager } from '@/components/settings/TaskTagManager';
import { TaskPriorityManager } from '@/components/settings/TaskPriorityManager';
import { CheckSquare, Tag, ArrowUp } from 'lucide-react';
import { BackButton } from '@/components/back-button';

export default function TaskSettingsPage() {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-3">
          <BackButton fallbackRoute="/settings" variant="ghost" />
        </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Customização de Tarefas</h1>
        <p className="text-muted-foreground">
          Personalize status, tags e prioridades de tarefas para sua empresa
        </p>
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="priorities" className="gap-2">
            <ArrowUp className="h-4 w-4" />
            Prioridades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <TaskStatusManager />
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <TaskTagManager />
        </TabsContent>

        <TabsContent value="priorities" className="space-y-4">
          <TaskPriorityManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
