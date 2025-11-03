
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  actions,
}: SettingsSectionProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {Icon && (
              <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-xl">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1.5">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {actions && (
            <div className="ml-4">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
