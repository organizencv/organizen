
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import Image from 'next/image';

interface EmailPreviewProps {
  subject: string;
  body: string;
  footer?: string;
  senderName?: string;
  primaryColor?: string;
  logoUrl?: string;
  templateType: string;
}

const SAMPLE_DATA = {
  welcome: {
    userName: 'João Silva',
    userEmail: 'joao@exemplo.com',
    companyName: 'Minha Empresa',
    loginUrl: 'https://organizen.com/login',
  },
  reset: {
    userName: 'Maria Santos',
    resetLink: 'https://organizen.com/reset-password?token=abc123',
    companyName: 'Minha Empresa',
    expiresIn: '24 horas',
  },
  invite: {
    inviterName: 'Carlos Oliveira',
    companyName: 'Minha Empresa',
    inviteLink: 'https://organizen.com/invite?token=xyz789',
    teamName: 'Marketing',
  },
  notify: {
    userName: 'Ana Costa',
    companyName: 'Minha Empresa',
    notificationTitle: 'Nova atualização disponível',
    notificationBody: 'Acesse o sistema para ver as novidades.',
  },
};

export default function EmailPreview({
  subject,
  body,
  footer,
  senderName,
  primaryColor = '#3B82F6',
  logoUrl,
  templateType,
}: EmailPreviewProps) {
  // Substitui as variáveis pelos dados de exemplo
  const sampleData = SAMPLE_DATA[templateType as keyof typeof SAMPLE_DATA] || {};
  
  let processedSubject = subject;
  let processedBody = body;
  let processedFooter = footer || '';

  Object.entries(sampleData).forEach(([key, value]) => {
    const variable = `{{${key}}}`;
    processedSubject = processedSubject.replace(new RegExp(variable, 'g'), value);
    processedBody = processedBody.replace(new RegExp(variable, 'g'), value);
    processedFooter = processedFooter.replace(new RegExp(variable, 'g'), value);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Preview do Email</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          {/* Cabeçalho do Email */}
          <div
            className="p-6 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {logoUrl && (
              <div className="mb-4 flex justify-center">
                <div className="relative w-32 h-12">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            <h2 className="text-xl font-bold text-center">{processedSubject}</h2>
          </div>

          {/* Corpo do Email */}
          <div className="p-6 bg-background">
            <div className="space-y-2">
              {processedBody.split('\n').map((line, idx) => (
                <p key={idx} className="text-sm">
                  {line || <br />}
                </p>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          {processedFooter && (
            <div className="p-6 bg-muted border-t">
              <p className="text-xs text-muted-foreground text-center">
                {processedFooter}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>De:</strong> {senderName || 'Equipe OrganiZen'}
            <br />
            <strong>Assunto:</strong> {processedSubject}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
