
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DayHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface BusinessHoursEditorProps {
  initialHours?: BusinessHours | null;
  onSuccess?: () => void;
}

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const defaultHours: DayHours = {
  enabled: true,
  start: '09:00',
  end: '18:00',
};

export function BusinessHoursEditor({ initialHours, onSuccess }: BusinessHoursEditorProps) {
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState<BusinessHours>(
    initialHours || {
      monday: defaultHours,
      tuesday: defaultHours,
      wednesday: defaultHours,
      thursday: defaultHours,
      friday: defaultHours,
      saturday: { enabled: false, start: '09:00', end: '18:00' },
      sunday: { enabled: false, start: '09:00', end: '18:00' },
    }
  );

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHours: hours }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success('Horário de funcionamento atualizado!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar horário');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string, enabled: boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof BusinessHours], enabled },
    }));
  };

  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof BusinessHours], [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Horário de Funcionamento</h3>
      </div>

      <div className="space-y-4">
        {daysOfWeek.map(({ key, label }) => {
          const dayHours = hours[key as keyof BusinessHours];
          return (
            <div
              key={key}
              className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3 md:w-48">
                <Switch
                  checked={dayHours.enabled}
                  onCheckedChange={(checked) => handleDayToggle(key, checked)}
                />
                <Label className="font-medium">{label}</Label>
              </div>

              {dayHours.enabled ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Das:</Label>
                    <Input
                      type="time"
                      value={dayHours.start}
                      onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                      className="flex-1 sm:w-28"
                    />
                  </div>
                  <span className="text-muted-foreground hidden sm:inline">até</span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Às:</Label>
                    <Input
                      type="time"
                      value={dayHours.end}
                      onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                      className="flex-1 sm:w-28"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Fechado</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Horários
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
