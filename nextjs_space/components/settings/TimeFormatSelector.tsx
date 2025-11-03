

'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock } from 'lucide-react';

interface TimeFormatSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeFormatSelector({ value, onChange }: TimeFormatSelectorProps) {
  const currentTime24h = new Date().toLocaleTimeString('pt-PT', { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentTime12h = new Date().toLocaleTimeString('pt-PT', { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="space-y-3">
      <Label>Formato de Hora</Label>
      <RadioGroup value={value || '24h'} onValueChange={onChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="24h" id="time-24h" />
          <Label htmlFor="time-24h" className="cursor-pointer font-normal">
            24 horas (ex: {currentTime24h})
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="12h" id="time-12h" />
          <Label htmlFor="time-12h" className="cursor-pointer font-normal">
            12 horas (ex: {currentTime12h})
          </Label>
        </div>
      </RadioGroup>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Hora atual: {value === '12h' ? currentTime12h : currentTime24h}</span>
      </div>
    </div>
  );
}
