
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PartyPopper, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BirthdayTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sendBirthdayNotifications = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug/test-birthday-notifications', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erro ao enviar notificações');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <PartyPopper className="h-16 w-16 text-purple-500" />
            </div>
            <CardTitle className="text-3xl">🎂 Teste de Notificações de Aniversário</CardTitle>
            <CardDescription className="text-lg">
              Clique no botão abaixo para enviar notificações de aniversário para todos os aniversariantes de hoje
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Button
                onClick={sendBirthdayNotifications}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando notificações...
                  </>
                ) : (
                  <>
                    <PartyPopper className="mr-2 h-5 w-5" />
                    Enviar Notificações de Aniversário
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <PartyPopper className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>✅ Notificações enviadas com sucesso!</strong>
                  </AlertDescription>
                </Alert>

                <Card className="bg-blue-50 dark:bg-blue-900/20">
                  <CardHeader>
                    <CardTitle className="text-lg">📊 Resumo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>🎂 Aniversariantes hoje:</strong> {result.summary?.birthdayUsersToday || 0}
                    </p>
                    <p>
                      <strong>🔔 Notificações criadas:</strong> {result.summary?.notificationsCreated || 0}
                    </p>
                    {result.summary?.skippedBecauseAlreadySent > 0 && (
                      <p className="text-amber-600 dark:text-amber-400">
                        <strong>⚠️ Já enviadas anteriormente:</strong> {result.summary.skippedBecauseAlreadySent}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {result.birthdayUsers && result.birthdayUsers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🎉 Aniversariantes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.birthdayUsers.map((user: any) => (
                          <li key={user.id} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                            <PartyPopper className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold">{user.name}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">({user.email})</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {result.logs && result.logs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📝 Logs Detalhados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                        {result.logs.map((log: string, index: number) => (
                          <div key={index} className="text-gray-700 dark:text-gray-300">
                            {log}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>🔔 Próximos passos:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Clique no <strong>sino 🔔</strong> no topo da página para ver as notificações</li>
                      <li>Acesse o <strong>perfil</strong> dos aniversariantes para ver o badge "Feliz Aniversário"</li>
                      <li>Faça login como aniversariante para ver a mensagem no <strong>Dashboard</strong></li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-lg">ℹ️ Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              • Esta página é apenas para <strong>testes</strong> durante o desenvolvimento
            </p>
            <p>
              • Em produção, as notificações são enviadas <strong>automaticamente às 9h00</strong> todos os dias
            </p>
            <p>
              • Você pode enviar notificações múltiplas vezes, mas o sistema detecta duplicatas
            </p>
            <p>
              • Data de hoje: <strong>{new Date().toLocaleDateString('pt-PT')}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
