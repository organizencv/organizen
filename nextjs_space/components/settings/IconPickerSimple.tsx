
'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as LucideIcons from 'lucide-react';
import { Check, X } from 'lucide-react';

interface IconPickerSimpleProps {
  value: string | null;
  onChange: (icon: string | null) => void;
  label?: string;
}

// Lista de ícones mais usados para tarefas
const COMMON_ICONS = [
  'Circle',
  'CheckCircle',
  'CheckCircle2',
  'Clock',
  'AlertCircle',
  'AlertTriangle',
  'XCircle',
  'ArrowRight',
  'Play',
  'Pause',
  'Square',
  'Zap',
  'Star',
  'Flag',
  'Bookmark',
  'ArrowUp',
  'ArrowDown',
  'Minus',
  'Plus',
  'Flame',
  'Target',
  'TrendingUp',
  'Activity',
  'BarChart',
];

export function IconPickerSimple({ value, onChange, label }: IconPickerSimpleProps) {
  const [search, setSearch] = React.useState('');
  
  const filteredIcons = COMMON_ICONS.filter(icon =>
    icon?.toLowerCase()?.includes(search?.toLowerCase() || '')
  );

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            type="button"
          >
            {value ? (
              <>
                {getIconComponent(value)}
                <span className="text-xs">{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">Selecionar ícone (opcional)</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Buscar ícone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onChange(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {filteredIcons.map((iconName) => {
                const IconComponent = (LucideIcons as any)[iconName];
                if (!IconComponent) return null;
                
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => onChange(iconName)}
                    className="h-10 w-10 rounded border hover:bg-accent transition-colors flex items-center justify-center relative"
                    title={iconName}
                  >
                    <IconComponent className="h-5 w-5" />
                    {value === iconName && (
                      <Check className="h-3 w-3 text-primary absolute top-0 right-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {filteredIcons.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ícone encontrado
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
