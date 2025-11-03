
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getTranslation, Language } from '@/lib/i18n';
import { X, Calendar, User, Clock, AlertCircle, CheckSquare, MessageSquare, FileText, Tag, Paperclip } from 'lucide-react';
import { TaskBasicInfo } from './task-basic-info';
import { TaskSubtasks } from './task-subtasks';
import { TaskComments } from './task-comments';
import { TaskChecklist } from './task-checklist';
import { TaskTags } from './task-tags';
import { TaskAttachments } from './task-attachments';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority?: string;
  customStatus?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  customPriority?: {
    id: string;
    name: string;
    color: string;
    icon: string;
    level: number;
  } | null;
  customTags?: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  subtasks?: any[];
  comments?: any[];
  checkItems?: any[];
  tags?: any[];
  attachments?: any[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface TaskDetailsModalProps {
  task: Task | null;
  users: User[];
  userRole: string;
  currentUserId: string;
  onClose: () => void;
  onUpdate: (task: any) => void;
  language: Language;
}

export function TaskDetailsModal({
  task,
  users,
  userRole,
  currentUserId,
  onClose,
  onUpdate,
  language
}: TaskDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [taskData, setTaskData] = useState(task);

  useEffect(() => {
    setTaskData(task);
  }, [task]);

  if (!task || !taskData) return null;

  const handleTaskUpdate = (updatedTask: any) => {
    setTaskData(updatedTask);
    onUpdate(updatedTask);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-muted text-foreground';
      case 'MEDIUM':
        return 'bg-primary/10 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getPriorityTranslation = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return getTranslation('low', language);
      case 'MEDIUM':
        return getTranslation('medium', language);
      case 'HIGH':
        return getTranslation('high', language);
      case 'URGENT':
        return getTranslation('urgent', language);
      default:
        return priority;
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'PENDING':
        return getTranslation('pending', language);
      case 'IN_PROGRESS':
        return getTranslation('inProgress', language);
      case 'COMPLETED':
        return getTranslation('completed', language);
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-primary/10 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const completedCheckItems = taskData?.checkItems?.filter(item => item?.completed)?.length || 0;
  const totalCheckItems = taskData?.checkItems?.length || 0;
  const checklistProgress = totalCheckItems > 0 ? Math.round((completedCheckItems / totalCheckItems) * 100) : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-3">
                {taskData?.title}
              </DialogTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(taskData?.status)}>
                  {getStatusTranslation(taskData?.status)}
                </Badge>
                {taskData?.priority && (
                  <Badge className={getPriorityColor(taskData.priority)}>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {getPriorityTranslation(taskData.priority)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {taskData?.user?.name || taskData?.user?.email}
            </div>
            {taskData?.dueDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(new Date(taskData.dueDate), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0 grid grid-cols-6 w-full">
            <TabsTrigger value="info" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Info' : 'Info'}</span>
            </TabsTrigger>
            <TabsTrigger value="subtasks" className="gap-1">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{getTranslation('subtasks', language)}</span>
              {(taskData?.subtasks?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">{taskData?.subtasks?.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{getTranslation('checklist', language)}</span>
              {totalCheckItems > 0 && (
                <Badge variant="secondary" className="ml-1">{checklistProgress}%</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{getTranslation('comments', language)}</span>
              {(taskData?.comments?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">{taskData?.comments?.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-1">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">{getTranslation('tags', language)}</span>
              {(taskData?.tags?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">{taskData?.tags?.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-1">
              <Paperclip className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Anexos' : 'Files'}</span>
              {(taskData?.attachments?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">{taskData?.attachments?.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="info" className="mt-0">
              <TaskBasicInfo
                task={taskData}
                users={users}
                userRole={userRole}
                currentUserId={currentUserId}
                onUpdate={handleTaskUpdate}
                language={language}
              />
            </TabsContent>

            <TabsContent value="subtasks" className="mt-0">
              <TaskSubtasks
                task={taskData}
                users={users}
                userRole={userRole}
                currentUserId={currentUserId}
                onUpdate={handleTaskUpdate}
                language={language}
              />
            </TabsContent>

            <TabsContent value="checklist" className="mt-0">
              <TaskChecklist
                taskId={taskData?.id}
                checkItems={taskData?.checkItems || []}
                onUpdate={handleTaskUpdate}
                language={language}
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <TaskComments
                taskId={taskData?.id}
                comments={taskData?.comments || []}
                currentUserId={currentUserId}
                onUpdate={handleTaskUpdate}
                language={language}
              />
            </TabsContent>

            <TabsContent value="tags" className="mt-0">
              <TaskTags
                taskId={taskData?.id}
                tags={taskData?.tags || []}
                onUpdate={handleTaskUpdate}
                language={language}
              />
            </TabsContent>

            <TabsContent value="attachments" className="mt-0">
              <TaskAttachments
                taskId={taskData?.id}
                attachments={taskData?.attachments || []}
                onUpdate={handleTaskUpdate}
                language={language}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
