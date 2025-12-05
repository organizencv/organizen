

'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarDays } from 'lucide-react';

interface FirstDaySelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export function FirstDaySelector({ value, onChange }: FirstDaySelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Primeiro Dia da Semana</Label>
      <RadioGroup 
        value={String(value ?? 1)} 
        onValueChange={(val) => onChange(parseInt(val))}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id="first-monday" />
          <Label htmlFor="first-monday" className="cursor-pointer font-normal">
            Segunda-feira
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="0" id="first-sunday" />
          <Label htmlFor="first-sunday" className="cursor-pointer font-normal">
            Domingo
          </Label>
        </div>
      </RadioGroup>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span>Afeta a exibição do calendário e visualizações semanais</span>
      </div>
    </div>
  );
}
