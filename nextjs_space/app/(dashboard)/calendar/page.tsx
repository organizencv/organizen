
import { Metadata } from 'next';
import CalendarContent from '@/components/calendar-content';

export const metadata: Metadata = {
  title: 'Calendário | OrganiZen',
  description: 'Sistema de calendário integrado'
};

export default function CalendarPage() {
  return <CalendarContent />;
}
