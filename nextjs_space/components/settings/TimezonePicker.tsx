

'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';

interface TimezonePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const TIMEZONES = [
  { value: 'Atlantic/Cape_Verde', label: 'Atlântico/Cabo Verde (CVT, UTC-1)', region: 'África' },
  { value: 'Europe/Lisbon', label: 'Europa/Lisboa (WET)', region: 'Europa' },
  { value: 'Europe/London', label: 'Europa/Londres (GMT)', region: 'Europa' },
  { value: 'Europe/Paris', label: 'Europa/Paris (CET)', region: 'Europa' },
  { value: 'Europe/Madrid', label: 'Europa/Madrid (CET)', region: 'Europa' },
  { value: 'Europe/Berlin', label: 'Europa/Berlim (CET)', region: 'Europa' },
  { value: 'Europe/Rome', label: 'Europa/Roma (CET)', region: 'Europa' },
  { value: 'America/Sao_Paulo', label: 'América/São Paulo (BRT)', region: 'América do Sul' },
  { value: 'America/Buenos_Aires', label: 'América/Buenos Aires (ART)', region: 'América do Sul' },
  { value: 'America/New_York', label: 'América/Nova York (EST)', region: 'América do Norte' },
  { value: 'America/Chicago', label: 'América/Chicago (CST)', region: 'América do Norte' },
  { value: 'America/Los_Angeles', label: 'América/Los Angeles (PST)', region: 'América do Norte' },
  { value: 'America/Mexico_City', label: 'América/Cidade do México (CST)', region: 'América do Norte' },
  { value: 'Asia/Tokyo', label: 'Ásia/Tóquio (JST)', region: 'Ásia' },
  { value: 'Asia/Shanghai', label: 'Ásia/Xangai (CST)', region: 'Ásia' },
  { value: 'Asia/Dubai', label: 'Ásia/Dubai (GST)', region: 'Ásia' },
  { value: 'Australia/Sydney', label: 'Austrália/Sydney (AEST)', region: 'Oceania' },
  { value: 'Pacific/Auckland', label: 'Pacífico/Auckland (NZST)', region: 'Oceania' },
  { value: 'Africa/Johannesburg', label: 'África/Joanesburgo (SAST)', region: 'África' },
  { value: 'Africa/Luanda', label: 'África/Luanda (WAT)', region: 'África' },
  { value: 'Africa/Maputo', label: 'África/Maputo (CAT)', region: 'África' },
  { value: 'UTC', label: 'UTC (Tempo Universal Coordenado)', region: 'Global' },
];

export function TimezonePicker({ value, onChange }: TimezonePickerProps) {
  const currentTime = new Date().toLocaleTimeString('pt-PT', { 
    timeZone: value,
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="timezone">Fuso Horário</Label>
      <Select value={value || 'Europe/Lisbon'} onValueChange={onChange}>
        <SelectTrigger id="timezone">
          <SelectValue placeholder="Selecione o fuso horário" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Hora atual: {currentTime}</span>
      </div>
    </div>
  );
}
