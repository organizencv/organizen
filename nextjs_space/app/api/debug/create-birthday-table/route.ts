
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Criar tabela birthday_settings no banco de produção
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const logs: string[] = [];

    try {
      // 1. Criar tabela
      logs.push('🔨 Criando tabela birthday_settings...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "birthday_settings" (
          "id" TEXT NOT NULL,
          "companyId" TEXT NOT NULL,
          "enabled" BOOLEAN NOT NULL DEFAULT true,
          "visibility" TEXT NOT NULL DEFAULT 'ALL',
          "notifyBirthdayPerson" BOOLEAN NOT NULL DEFAULT true,
          "notifyTeamMembers" BOOLEAN NOT NULL DEFAULT true,
          "notifyManagers" BOOLEAN NOT NULL DEFAULT true,
          "customMessage" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "birthday_settings_pkey" PRIMARY KEY ("id")
        );
      `;
      logs.push('✅ Tabela criada!');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        logs.push('⚠️  Tabela já existe');
      } else {
        throw error;
      }
    }

    try {
      // 2. Criar índice único
      logs.push('🔨 Criando índice único...');
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "birthday_settings_companyId_key" 
        ON "birthday_settings"("companyId");
      `;
      logs.push('✅ Índice criado!');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        logs.push('⚠️  Índice já existe');
      } else {
        throw error;
      }
    }

    try {
      // 3. Criar foreign key
      logs.push('🔨 Criando foreign key...');
      await prisma.$executeRaw`
        ALTER TABLE "birthday_settings" 
        ADD CONSTRAINT "birthday_settings_companyId_fkey" 
        FOREIGN KEY ("companyId") 
        REFERENCES "companies"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      logs.push('✅ Foreign key criada!');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        logs.push('⚠️  Foreign key já existe');
      } else {
        throw error;
      }
    }

    // 4. Verificar se a tabela existe agora
    logs.push('🔍 Verificando existência da tabela...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'birthday_settings'
      );
    `;
    logs.push(`✅ Tabela existe: ${JSON.stringify(tableExists)}`);

    // 5. Tentar buscar configurações
    logs.push('🔍 Testando busca...');
    const settings = await prisma.birthdaySettings.findFirst();
    logs.push(`✅ Busca funcionou! Found: ${settings ? 'Sim' : 'Não'}`);

    return NextResponse.json({
      success: true,
      message: 'Birthday settings table created successfully',
      logs,
      tableExists,
      settingsFound: !!settings,
    });

  } catch (error) {
    console.error('Create table error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
