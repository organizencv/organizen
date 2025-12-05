
'use client';

import { Card } from '@/components/ui/card';
import { getTranslation, Language } from '@/lib/i18n';
import { format, isSameDay, startOfWeek, addDays } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';

interface CalendarViewProps {
  view: 'month' | 'week' | 'day';
  currentDate: Date;
  events: any[];
  onEventClick?: (event: any) => void;
  isLoading: boolean;
  language: Language;
}

export default function CalendarView({
  view,
  currentDate,
  events,
  onEventClick,
  isLoading,
  language
}: CalendarViewProps) {
  const t = (key: any) => getTranslation(key, language);
  const locale = language === 'pt' ? pt : enUS;

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">{t('loading')}</p>
      </Card>
    );
  }

  if (view === 'month') {
    return <MonthView currentDate={currentDate} events={events} onEventClick={onEventClick} language={language} locale={locale} />;
  } else if (view === 'week') {
    return <WeekView currentDate={currentDate} events={events} onEventClick={onEventClick} language={language} locale={locale} />;
  } else {
    return <DayView currentDate={currentDate} events={events} onEventClick={onEventClick} language={language} locale={locale} />;
  }
}

// Vista Mensal
function MonthView({ currentDate, events, onEventClick, language, locale }: any) {
  const t = (key: any) => getTranslation(key, language);
  
  // Calcular dias do mês
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Começar no domingo anterior ao primeiro dia
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  // Terminar no sábado após o último dia
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  // Criar array de dias
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  if (language === 'en') {
    weekDays.splice(0, 7, 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event: any) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Verificar se o evento está neste dia
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return (
        (eventStart >= dayStart && eventStart <= dayEnd) ||
        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
        (eventStart <= dayStart && eventEnd >= dayEnd)
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <Card className="overflow-hidden">
      {/* Header com dias da semana */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {weekDays.map((day, i) => (
          <div key={i} className="p-3 text-center font-semibold text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDay = isToday(day);

          return (
            <div
              key={i}
              className={`min-h-[120px] p-2 border-b border-r ${
                !isCurrentMonthDay ? 'bg-muted/20' : ''
              } ${isTodayDay ? 'bg-primary/5' : ''}`}
            >
              <div
                className={`text-sm font-semibold mb-1 ${
                  isTodayDay
                    ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center'
                    : isCurrentMonthDay
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => onEventClick?.(event)}
                    className="w-full text-left text-xs p-1 rounded truncate hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: event.color, color: 'white' }}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Vista Semanal
function WeekView({ currentDate, events, onEventClick, language, locale }: any) {
  const t = (key: any) => getTranslation(key, language);
  
  // Calcular dias da semana
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  if (language === 'en') {
    weekDayNames.splice(0, 7, 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter((event: any) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      const hourStart = new Date(date);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(date);
      hourEnd.setHours(hour, 59, 59, 999);
      
      return (
        isSameDay(eventStart, date) &&
        ((eventStart >= hourStart && eventStart <= hourEnd) ||
         (eventEnd >= hourStart && eventEnd <= hourEnd) ||
         (eventStart <= hourStart && eventEnd >= hourEnd))
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  return (
    <Card className="overflow-auto max-h-[600px]">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
          <div className="p-3 border-r bg-muted/50"></div>
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`p-3 text-center border-r ${
                isToday(day) ? 'bg-primary/10' : 'bg-muted/50'
              }`}
            >
              <div className="font-semibold">{weekDayNames[i]}</div>
              <div
                className={`text-2xl ${
                  isToday(day) ? 'text-primary font-bold' : ''
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horas */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b">
            <div className="p-2 border-r bg-muted/20 text-xs text-muted-foreground text-right">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map((day, i) => {
              const hourEvents = getEventsForDayAndHour(day, hour);
              return (
                <div key={i} className="p-1 border-r min-h-[60px]">
                  <div className="space-y-1">
                    {hourEvents.map((event: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => onEventClick?.(event)}
                        className="w-full text-left text-xs p-1 rounded hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: event.color, color: 'white' }}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="text-[10px] opacity-90">
                          {format(new Date(event.start), 'HH:mm', { locale })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

// Vista Diária
function DayView({ currentDate, events, onEventClick, language, locale }: any) {
  const t = (key: any) => getTranslation(key, language);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    return events.filter((event: any) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      const hourStart = new Date(currentDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(currentDate);
      hourEnd.setHours(hour, 59, 59, 999);
      
      return (
        isSameDay(eventStart, currentDate) &&
        ((eventStart >= hourStart && eventStart <= hourEnd) ||
         (eventEnd >= hourStart && eventEnd <= hourEnd) ||
         (eventStart <= hourStart && eventEnd >= hourEnd))
      );
    });
  };

  const dayEvents = events.filter((event: any) => 
    isSameDay(new Date(event.start), currentDate)
  );

  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-6">
      {/* Linha do tempo */}
      <Card className="overflow-auto max-h-[600px]">
        <div className="min-w-[400px]">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            return (
              <div key={hour} className="flex border-b">
                <div className="w-20 p-3 border-r bg-muted/20 text-sm text-muted-foreground text-right flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-2 min-h-[80px]">
                  <div className="space-y-2">
                    {hourEvents.map((event: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => onEventClick?.(event)}
                        className="w-full text-left p-3 rounded hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: event.color, color: 'white' }}
                      >
                        <div className="font-semibold">{event.title}</div>
                        <div className="text-sm opacity-90 mt-1">
                          {format(new Date(event.start), 'HH:mm', { locale })} -{' '}
                          {format(new Date(event.end), 'HH:mm', { locale })}
                        </div>
                        {event.description && (
                          <div className="text-sm opacity-80 mt-1 line-clamp-2">
                            {event.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Lista de eventos do dia */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">{t('upcomingEvents')}</h3>
        {dayEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noEventsToday')}</p>
        ) : (
          <div className="space-y-3">
            {dayEvents
              .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .map((event: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left p-3 rounded border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{event.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(event.start), 'HH:mm', { locale })} -{' '}
                        {format(new Date(event.end), 'HH:mm', { locale })}
                      </div>
                      {event.location && (
                        <div className="text-xs text-muted-foreground mt-1">
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
