'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { getTranslation, Language } from '@/lib/i18n';
import { Calendar, FileText, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { pt, enUS, es, fr } from 'date-fns/locale';
import { Button } from './ui/button';

interface HolidayDetailsModalProps {
  holidayId: string;
  language: Language;
  onClose: () => void;
}

interface HolidayDetails {
  id: string;
  name: string;
  description: string | null;
  date: string;
  isRecurring: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export default function HolidayDetailsModal({
  holidayId,
  language,
  onClose
}: HolidayDetailsModalProps) {
  const [holiday, setHoliday] = useState<HolidayDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = (key: any) => getTranslation(key, language);
  const locale = language === 'pt' ? pt : language === 'es' ? es : language === 'fr' ? fr : enUS;

  useEffect(() => {
    if (holidayId) {
      fetchHolidayDetails();
    }
  }, [holidayId]);

  const fetchHolidayDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/settings/holidays/${holidayId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes do feriado');
      }
      
      const data = await response.json();
      setHoliday(data);
    } catch (error: any) {
      console.error('Erro ao buscar feriado:', error);
      setError(error.message || 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              {t('holidayDetails')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : error ? (
          <Card className="bg-destructive/10 border-destructive">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-destructive font-semibold mb-2">❌ {t('error')}</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  onClick={fetchHolidayDetails}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('tryAgain')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : holiday ? (
          <div className="space-y-4">
            {/* Nome do Feriado */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {holiday.name}
                    </h3>
                    {holiday.isRecurring && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {t('recurring')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('date')}</p>
                    <p className="font-semibold">
                      {format(new Date(holiday.date), "dd 'de' MMMM 'de' yyyy", { locale })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descrição */}
            {holiday.description && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">{t('description')}</p>
                      <p className="text-foreground whitespace-pre-wrap">{holiday.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações Adicionais */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('createdAt')}</p>
                    <p className="font-medium">
                      {format(new Date(holiday.createdAt), 'dd/MM/yyyy HH:mm', { locale })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('updatedAt')}</p>
                    <p className="font-medium">
                      {format(new Date(holiday.updatedAt), 'dd/MM/yyyy HH:mm', { locale })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
