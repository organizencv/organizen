
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Globe,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { pt, enUS, es, fr, type Locale } from 'date-fns/locale';
import { BackButton } from '@/components/back-button';

interface ActiveSession {
  id: string;
  sessionToken: string;
  device?: string;
  ipAddress?: string;
  location?: string;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

const localeMap: Record<string, Locale> = {
  pt: pt,
  en: enUS,
  es: es,
  fr: fr,
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguage] = useState('pt');

  useEffect(() => {
    // Detectar o idioma do usuário
    const userLang = navigator.language.split('-')[0];
    setLanguage(userLang);
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/sessions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError('Erro ao carregar sessões ativas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeSession = async (sessionId: string) => {
    try {
      setRemovingId(sessionId);
      setError(null);
      
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove session');
      }

      setSuccess('Sessão removida com sucesso');
      await fetchSessions();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erro ao remover sessão');
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  const removeAllOtherSessions = async () => {
    if (!confirm('Tem certeza que deseja encerrar todas as outras sessões? Você será desconectado em todos os outros dispositivos.')) {
      return;
    }

    try {
      setRemovingAll(true);
      setError(null);
      
      const response = await fetch('/api/sessions', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove sessions');
      }

      setSuccess('Todas as outras sessões foram encerradas');
      await fetchSessions();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erro ao remover sessões');
      console.error(err);
    } finally {
      setRemovingAll(false);
    }
  };

  const getDeviceIcon = (device?: string) => {
    if (!device || device.trim() === '') return <Monitor className="h-5 w-5" />;
    
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('mobile') || deviceLower.includes('iphone') || deviceLower.includes('android')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const formatDateTime = (dateString: string) => {
    try {
      const locale = localeMap[language] || pt;
      return format(new Date(dateString), "PPp", { locale });
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Agora mesmo';
      if (diffInMinutes < 60) return `Há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2">Carregando sessões...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <div className="mb-3">
          <BackButton fallbackRoute="/settings" variant="ghost" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Sessões Ativas</h1>
        <p className="text-muted-foreground">
          Gerencie as sessões ativas da sua conta. Você pode encerrar sessões suspeitas ou antigas.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
        </Alert>
      )}

      {sessions.length > 1 && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={removeAllOtherSessions}
            disabled={removingAll}
            className="w-full sm:w-auto"
          >
            {removingAll ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Encerrando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Encerrar todas as outras sessões
              </>
            )}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className={session.isCurrent ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {getDeviceIcon(session.device)}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {session.device || 'Dispositivo desconhecido'}
                      {session.isCurrent && (
                        <Badge variant="default" className="ml-2">
                          Sessão Atual
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Última atividade: {formatRelativeTime(session.lastActivity)}</span>
                        </div>
                        {session.ipAddress && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-3.5 w-3.5" />
                            <span>IP: {session.ipAddress}</span>
                            {session.location && <span>• {session.location}</span>}
                          </div>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSession(session.id)}
                    disabled={removingId === session.id}
                  >
                    {removingId === session.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Criada em:</span> {formatDateTime(session.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Expira em:</span> {formatDateTime(session.expiresAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma sessão ativa encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
