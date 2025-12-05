
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBranding } from '@/lib/branding/get-branding';
import { getDownloadUrl } from '@/lib/s3';
import { generateBrandedPDFHTML } from '@/lib/pdf/branded-pdf-template';
import { getTranslation } from '@/lib/i18n';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { reportData, reportType, period } = body;

    // Obter configurações de branding da empresa
    const branding = await getBranding(session.user.companyId);
    
    // Obter idioma do utilizador
    const lang = (session.user as any).language || 'pt';
    
    // Preparar traduções necessárias
    const translations = {
      generatedReport: getTranslation('generatedReport', lang),
      period: getTranslation('period', lang),
      generatedAt: getTranslation('generatedAt', lang),
      company: getTranslation('company', lang),
      overview: getTranslation('overview', lang),
      totalTasks: getTranslation('totalTasks', lang),
      completed: getTranslation('completed', lang),
      completionRate: getTranslation('completionRate', lang),
      ofTotalTasks: getTranslation('ofTotalTasks', lang),
      totalMessages: getTranslation('totalMessages', lang),
      unread: getTranslation('unread', lang),
      totalUsers: getTranslation('totalUsers', lang),
      activeUsers: getTranslation('activeUsers', lang),
      userProductivity: getTranslation('userProductivity', lang),
      name: getTranslation('name', lang),
      completedTasks: getTranslation('completedTasks', lang),
      messagesSent: getTranslation('messagesSent', lang),
      shiftsCompleted: getTranslation('shiftsCompleted', lang),
      tasksTimeline: getTranslation('tasksTimeline', lang),
      chartInfo: getTranslation('chartInfo', lang),
      chartNote: getTranslation('chartNote', lang),
      date: getTranslation('date', lang),
      inProgress: getTranslation('inProgress', lang),
      pending: getTranslation('pending', lang),
      confidential: getTranslation('confidential', lang),
      generatedBy: getTranslation('generatedBy', lang),
      allRightsReserved: getTranslation('allRightsReserved', lang),
    };

    // Obter URL assinado do logo se existir
    let logoUrl: string | undefined;
    
    if (branding?.logoUrl) {
      try {
        // Gerar URL assinada do S3 para o logo
        logoUrl = await getDownloadUrl(branding.logoUrl);
      } catch (error) {
        console.error('Error generating logo URL:', error);
      }
    }

    // Preparar configurações de branding
    const brandingConfig = {
      logoUrl,
      primaryColor: branding?.primaryColor || '#2563eb',
      secondaryColor: branding?.secondaryColor || '#10b981',
      accentColor: branding?.accentColor || '#f59e0b',
      companyName: session.user.name || 'OrganiZen',
    };

    // Gerar HTML com branding
    const html = generateBrandedPDFHTML(
      reportData,
      reportType,
      period,
      brandingConfig,
      translations
    );

    // Retornar HTML que será convertido em PDF no cliente
    return NextResponse.json({ 
      html,
      success: true
    });

  } catch (error) {
    console.error('Export PDF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
