

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

interface DateFormatSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA', example: '27/10/2025' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA', example: '10/27/2025' },
  { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD', example: '2025-10-27' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.AAAA', example: '27.10.2025' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-AAAA', example: '27-10-2025' },
];

export function DateFormatSelector({ value, onChange }: DateFormatSelectorProps) {
  const selectedFormat = DATE_FORMATS.find((f) => f.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="dateFormat">Formato de Data</Label>
      <Select value={value || 'DD/MM/YYYY'} onValueChange={onChange}>
        <SelectTrigger id="dateFormat">
          <SelectValue placeholder="Selecione o formato" />
        </SelectTrigger>
        <SelectContent>
          {DATE_FORMATS.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              {format.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedFormat && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Exemplo: {selectedFormat.example}</span>
        </div>
      )}
    </div>
  );
}
