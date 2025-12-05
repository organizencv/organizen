
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function SettingsCard({
  title,
  description,
  icon,
  children,
  className,
  actions,
}: SettingsCardProps) {
  // Se não tem título nem descrição, renderiza apenas o conteúdo
  if (!title && !description) {
    return (
      <div className={cn('p-6 border rounded-lg bg-card', className)}>
        {children}
      </div>
    );
  }

  return (
    <Card className={cn('', className)}>
      {(title || description) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <CardTitle className="flex items-center gap-2">
                  {icon}
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="mt-1.5">
                  {description}
                </CardDescription>
              )}
            </div>
            {actions && (
              <div className="ml-4">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
