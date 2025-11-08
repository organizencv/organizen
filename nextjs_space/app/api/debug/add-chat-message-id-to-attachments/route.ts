
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Verificando coluna chatMessageId na tabela attachments...');
    
    // Verificar se a coluna já existe
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attachments' AND column_name = 'chatMessageId';
    `;
    
    if (Array.isArray(checkColumn) && checkColumn.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Coluna chatMessageId já existe na tabela attachments'
      });
    }

    console.log('[DEBUG] Coluna não existe. Adicionando...');

    // Adicionar a coluna
    await prisma.$executeRaw`
      ALTER TABLE attachments 
      ADD COLUMN "chatMessageId" TEXT;
    `;
    
    console.log('[DEBUG] ✓ Coluna adicionada');

    // Adicionar índice para performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "attachments_chatMessageId_idx" 
      ON attachments("chatMessageId");
    `;
    
    console.log('[DEBUG] ✓ Índice criado');

    // Verificar se funcionou
    const verify = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'attachments'
      ORDER BY ordinal_position;
    `;

    return NextResponse.json({
      success: true,
      message: 'Coluna chatMessageId adicionada com sucesso!',
      tableStructure: verify
    });

  } catch (error: any) {
    console.error('[DEBUG] Erro:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
