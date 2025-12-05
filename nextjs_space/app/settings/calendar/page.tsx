
"use client";

import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsCard } from "@/components/settings/SettingsCard";

import { ShiftTemplateManager } from "@/components/settings/ShiftTemplateManager";
import { HolidayManager } from "@/components/settings/HolidayManager";
import { Calendar, Clock, Sparkles } from "lucide-react";

export default function CalendarSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Calendário e Turnos</h1>
        <p className="text-muted-foreground mt-2">
          Configure templates de turnos e feriados da empresa
        </p>
      </div>

      {/* Templates de Turnos */}
      <SettingsSection
        title="Templates de Turnos"
        description="Crie templates para facilitar o agendamento de turnos recorrentes"
        icon={Clock}
      >
        <SettingsCard>
          <ShiftTemplateManager />
        </SettingsCard>
      </SettingsSection>

      {/* Feriados */}
      <SettingsSection
        title="Feriados"
        description="Gerencie os feriados da empresa para destacar no calendário"
        icon={Sparkles}
      >
        <SettingsCard>
          <HolidayManager />
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
