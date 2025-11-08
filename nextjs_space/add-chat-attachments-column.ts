
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📊 Adicionando coluna chatMessageId à tabela attachments...');
    
    await prisma.$executeRaw`
      ALTER TABLE attachments 
      ADD COLUMN IF NOT EXISTS "chatMessageId" TEXT
    `;
    console.log('✅ Coluna adicionada');
    
    console.log('📊 Criando índice...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "attachments_chatMessageId_idx" 
      ON attachments("chatMessageId")
    `;
    console.log('✅ Índice criado');
    
    console.log('📊 Adicionando foreign key...');
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'attachments_chatMessageId_fkey'
        ) THEN
          ALTER TABLE attachments 
          ADD CONSTRAINT attachments_chatMessageId_fkey 
          FOREIGN KEY ("chatMessageId") 
          REFERENCES chat_messages(id) 
          ON DELETE CASCADE;
        END IF;
      END $$
    `;
    console.log('✅ Foreign key adicionada');
    
    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
