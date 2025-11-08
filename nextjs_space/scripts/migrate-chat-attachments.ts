
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carregar variáveis de ambiente
config();

const prisma = new PrismaClient();

async function migrateAttachmentsTable() {
  try {
    console.log('[MIGRATE] Verificando coluna chatMessageId na tabela attachments...');
    
    // Verificar se a coluna já existe
    const checkColumn: any = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attachments' AND column_name = 'chatMessageId';
    `;
    
    if (Array.isArray(checkColumn) && checkColumn.length > 0) {
      console.log('[MIGRATE] ✓ Coluna chatMessageId já existe!');
      return;
    }

    console.log('[MIGRATE] Adicionando coluna chatMessageId...');
    
    // Adicionar a coluna
    await prisma.$executeRaw`
      ALTER TABLE attachments 
      ADD COLUMN "chatMessageId" TEXT;
    `;
    
    console.log('[MIGRATE] ✓ Coluna adicionada!');

    // Adicionar índice para performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "attachments_chatMessageId_idx" 
      ON attachments("chatMessageId");
    `;
    
    console.log('[MIGRATE] ✓ Índice criado!');

    // Verificar estrutura final
    const verify: any = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'attachments'
      ORDER BY ordinal_position;
    `;

    console.log('[MIGRATE] Estrutura final da tabela attachments:');
    verify.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error: any) {
    console.error('[MIGRATE] Erro:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAttachmentsTable()
  .then(() => {
    console.log('[MIGRATE] Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[MIGRATE] Falha na migração:', error);
    process.exit(1);
  });
