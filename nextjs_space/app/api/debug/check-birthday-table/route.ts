
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Verificar se a tabela birthday_settings existe
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar se a tabela existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'birthday_settings'
      );
    `;

    // Tentar buscar configurações
    let settingsQuery = null;
    let settingsError = null;
    try {
      settingsQuery = await prisma.birthdaySettings.findFirst();
    } catch (error) {
      settingsError = (error as Error).message;
    }

    // Verificar modelos disponíveis no Prisma Client
    const prismaModels = Object.keys(prisma).filter(
      k => !k.startsWith('$') && !k.startsWith('_')
    ).sort();

    return NextResponse.json({
      tableExists,
      settingsQuery,
      settingsError,
      hasBirthdaySettingsModel: prismaModels.includes('birthdaySettings'),
      prismaModels: prismaModels.slice(0, 20), // Primeiros 20 modelos
      totalModels: prismaModels.length,
    });

  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
