
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Adicionar BIRTHDAY ao enum NotificationType
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
      // 1. Verificar valores atuais do enum
      logs.push('🔍 Verificando enum NotificationType...');
      const enumValues = await prisma.$queryRaw<Array<{enumlabel: string}>>`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'NotificationType'
        );
      `;
      
      const currentValues = enumValues.map(v => v.enumlabel);
      logs.push(`✅ Valores atuais: ${currentValues.join(', ')}`);
      
      // 2. Verificar se BIRTHDAY já existe
      if (currentValues.includes('BIRTHDAY')) {
        logs.push('✅ BIRTHDAY já existe no enum!');
        return NextResponse.json({
          success: true,
          message: 'BIRTHDAY já existe no enum',
          logs,
          currentValues,
        });
      }
      
      // 3. Adicionar BIRTHDAY ao enum
      logs.push('🔨 Adicionando BIRTHDAY ao enum...');
      await prisma.$executeRaw`
        ALTER TYPE "NotificationType" ADD VALUE 'BIRTHDAY';
      `;
      logs.push('✅ BIRTHDAY adicionado com sucesso!');
      
      // 4. Verificar novamente
      const updatedEnumValues = await prisma.$queryRaw<Array<{enumlabel: string}>>`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'NotificationType'
        );
      `;
      
      const updatedValues = updatedEnumValues.map(v => v.enumlabel);
      logs.push(`✅ Valores atualizados: ${updatedValues.join(', ')}`);
      
      return NextResponse.json({
        success: true,
        message: 'BIRTHDAY added to NotificationType enum',
        logs,
        oldValues: currentValues,
        newValues: updatedValues,
      });

    } catch (error: any) {
      if (error.message.includes('already exists')) {
        logs.push('⚠️  BIRTHDAY já existe no enum');
        return NextResponse.json({
          success: true,
          message: 'BIRTHDAY already exists',
          logs,
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Fix birthday enum error:', error);
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
