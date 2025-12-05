
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTranslation, Language } from '@/lib/i18n';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: Language;
  event?: any;
}

export function EventModal({ open, onClose, onSuccess, language, event }: EventModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    eventType: event?.eventType || 'OTHER',
    location: event?.location || '',
    eventDate: event?.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
    endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
    status: event?.status || 'PLANNING',
    budget: event?.budget || '',
    estimatedGuests: event?.estimatedGuests || '',
    notes: event?.notes || '',
  });

  const t = (key: any) => getTranslation(key, language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = event ? `/api/events/${event.id}` : '/api/events';
      const method = event ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save event');
      }

      toast.success(t(event ? 'eventUpdated' : 'eventCreated'));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? t('editEvent') : t('newEvent')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('eventName')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={t('eventName')}
            />
          </div>

          <div>
            <Label htmlFor="eventType">{t('eventType')}</Label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => setFormData({ ...formData, eventType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventDate">{t('eventDate')} *</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">{t('endDate')}</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">{t('eventLocation')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t('eventLocation')}
            />
          </div>

          <div>
            <Label htmlFor="status">{t('eventStatus')}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNING">{t('planning')}</SelectItem>
                <SelectItem value="CONFIRMED">{t('confirmed')}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t('inProgress')}</SelectItem>
                <SelectItem value="COMPLETED">{t('completed')}</SelectItem>
                <SelectItem value="CANCELLED">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">{t('eventBudget')}</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="estimatedGuests">{t('estimatedGuests')}</Label>
              <Input
                id="estimatedGuests"
                type="number"
                value={formData.estimatedGuests}
                onChange={(e) => setFormData({ ...formData, estimatedGuests: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">{t('eventDescription')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('eventDescription')}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">{t('eventNotes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('eventNotes')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('loading') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
