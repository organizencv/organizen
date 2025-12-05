
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { getTranslation, Language } from '@/lib/i18n';
import { Plus, Search, Calendar as CalendarIcon } from 'lucide-react';
import { EventModal } from '@/components/events/event-modal';
import { EventCard } from '@/components/events/event-card';
import { PageHeader } from '@/components/page-header';
import toast from 'react-hot-toast';

export default function EventsPage() {
  const { data: session } = useSession();
  const [language, setLanguage] = useState<Language>('pt');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const t = (key: any) => getTranslation(key, language);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('userLanguage') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (session?.user?.language) {
      setLanguage(session.user.language as Language);
      localStorage.setItem('userLanguage', session.user.language);
    }
  }, [session]);

  useEffect(() => {
    loadEvents();
  }, [statusFilter, typeFilter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);

      const response = await fetch(`/api/events?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error(t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleDeleteEvent = async (event: any) => {
    if (!confirm(t('confirm'))) return;

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast.success(t('eventDeleted'));
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(t('errorOccurred'));
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleModalSuccess = () => {
    loadEvents();
  };

  const filteredEvents = events.filter((event) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.name.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.location?.toLowerCase().includes(searchLower)
    );
  });

  const canCreateEvent = !!session?.user?.role && ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title={t('events')}>
        {canCreateEvent && (
          <Button onClick={handleCreateEvent}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newEvent')}
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('eventStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="PLANNING">{t('planning')}</SelectItem>
              <SelectItem value="CONFIRMED">{t('confirmed')}</SelectItem>
              <SelectItem value="IN_PROGRESS">{t('inProgress')}</SelectItem>
              <SelectItem value="COMPLETED">{t('completed')}</SelectItem>
              <SelectItem value="CANCELLED">{t('cancelled')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('eventType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="WEDDING">{t('eventWedding')}</SelectItem>
              <SelectItem value="BIRTHDAY">{t('eventBirthday')}</SelectItem>
              <SelectItem value="CONFERENCE">{t('eventConference')}</SelectItem>
              <SelectItem value="CORPORATE">{t('eventCorporate')}</SelectItem>
              <SelectItem value="THEMED_PARTY">{t('eventThemedParty')}</SelectItem>
              <SelectItem value="CONGRESS">{t('eventCongress')}</SelectItem>
              <SelectItem value="OTHER">{t('other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            {t('noEvents')}
          </p>
          {canCreateEvent && (
            <>
              <p className="text-muted-foreground mb-4">
                {t('createFirstEvent')}
              </p>
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                {t('newEvent')}
              </Button>
            </>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              language={language}
              canManage={canCreateEvent}
              onEdit={() => handleEditEvent(event)}
              onDelete={() => handleDeleteEvent(event)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <EventModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        language={language}
        event={editingEvent}
      />
    </div>
  );
}
