
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Image as ImageIcon, 
  MessageSquare,
  Edit,
  Trash2
} from 'lucide-react';
import { getTranslation, Language } from '@/lib/i18n';
import { formatDistanceToNow } from 'date-fns';
import { pt, enUS, es, fr } from 'date-fns/locale';
import Link from 'next/link';

interface EventCardProps {
  event: any;
  language: Language;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
}

export function EventCard({ event, language, onEdit, onDelete, canManage }: EventCardProps) {
  const t = (key: any) => getTranslation(key, language);

  const localeMap = {
    pt,
    en: enUS,
    es,
    fr,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-blue-500',
      CONFIRMED: 'bg-green-500',
      IN_PROGRESS: 'bg-yellow-500',
      COMPLETED: 'bg-gray-500',
      CANCELLED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      WEDDING: 'eventWedding',
      BIRTHDAY: 'eventBirthday',
      CONFERENCE: 'eventConference',
      CORPORATE: 'eventCorporate',
      THEMED_PARTY: 'eventThemedParty',
      CONGRESS: 'eventCongress',
      OTHER: 'other',
    };
    return t(typeMap[type] || 'other');
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PLANNING: 'planning',
      CONFIRMED: 'confirmed',
      IN_PROGRESS: 'inProgress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    };
    return t(statusMap[status] || 'planning');
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <Link href={`/events/${event.id}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {event.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel(event.eventType)}
                </Badge>
                <Badge className={getStatusColor(event.status)}>
                  {getStatusLabel(event.status)}
                </Badge>
              </div>
            </div>

            {canManage && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit?.();
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete?.();
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(event.eventDate).toLocaleDateString(language, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{event._count?.collaborators || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              <span>{event._count?.images || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{event._count?.chatMessages || 0}</span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
