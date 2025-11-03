
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Calendar as CalendarIcon,
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { getTranslation, Language } from '@/lib/i18n';
import CalendarView from '@/components/calendar-view';
import EventModal from '@/components/event-modal';
import toast from 'react-hot-toast';

type ViewType = 'month' | 'week' | 'day';

export default function CalendarContent() {
  const { data: session } = useSession() || {};
  const [language, setLanguage] = useState<Language>('pt');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filters, setFilters] = useState({
    showShifts: true,
    showTasks: true,
    showEvents: true,
    showHolidays: true
  });

  const t = (key: any) => getTranslation(key, language);

  useEffect(() => {
    // Primeiro tenta ler do localStorage (persistência local)
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      // Fallback para a sessão se não houver no localStorage
      const sessionLang = session.user.language as Language;
      setLanguage(sessionLang);
      localStorage.setItem('userLanguage', sessionLang);
    }
  }, [session]);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, view, filters]);

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      
      // Calcular range de datas baseado na view
      const start = getStartDate();
      const end = getEndDate();

      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
        includeShifts: filters.showShifts.toString(),
        includeTasks: filters.showTasks.toString(),
        includeEvents: filters.showEvents.toString(),
        includeHolidays: filters.showHolidays.toString()
      });

      const response = await fetch(`/api/calendar?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      
      const data = await response.json();
      setCalendarData(data.items || []);
      
    } catch (error) {
      console.error('Error fetching calendar:', error);
      toast.error('Erro ao carregar calendário');
    } finally {
      setIsLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date(currentDate);
    
    if (view === 'month') {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      // Voltar para o domingo da semana que contém o dia 1
      const day = date.getDay();
      date.setDate(date.getDate() - day);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    
    return date;
  };

  const getEndDate = () => {
    const date = new Date(currentDate);
    
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
      // Avançar para o sábado da semana que contém o último dia
      const day = date.getDay();
      date.setDate(date.getDate() + (6 - day));
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() + (6 - day));
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    
    return date;
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric',
      month: 'long'
    };
    
    if (view === 'day') {
      options.day = 'numeric';
    } else if (view === 'week') {
      const start = getStartDate();
      const end = getEndDate();
      return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', { month: 'long', year: 'numeric' })}`;
    }
    
    return currentDate.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', options);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventSaved = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    fetchCalendarData();
  };

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            {t('calendar')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('calendarView')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleNewEvent}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('newEvent')}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCalendarData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Controles de Navegação e Vista */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Navegação de Data */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              {t('today')}
            </Button>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={navigatePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="min-w-[200px] text-center font-semibold">
                {formatDateHeader()}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={navigateNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Controles de Vista */}
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              {t('monthView')}
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              {t('weekView')}
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              {t('dayView')}
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Filter className="h-4 w-4" />
              {t('filters')}:
            </span>
            
            <Button
              variant={filters.showShifts ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('showShifts')}
              className={filters.showShifts ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {t('showShifts')}
            </Button>
            
            <Button
              variant={filters.showTasks ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('showTasks')}
              className={filters.showTasks ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {t('showTasks')}
            </Button>
            
            <Button
              variant={filters.showEvents ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('showEvents')}
              className={filters.showEvents ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {t('showEvents')}
            </Button>
            
            <Button
              variant={filters.showHolidays ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('showHolidays')}
              className={filters.showHolidays ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {t('showHolidays')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendário */}
      <CalendarView
        view={view}
        currentDate={currentDate}
        events={calendarData}
        onEventClick={handleEventClick}
        isLoading={isLoading}
        language={language}
      />

      {/* Modal de Evento */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          onSave={handleEventSaved}
          language={language}
        />
      )}
    </div>
  );
    }
