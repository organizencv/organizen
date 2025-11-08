require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTable() {
  try {
    console.log('🔍 Verificando tabela attachments...');
    
    // Tentar contar registros
    const count = await prisma.attachment.count();
    console.log('✅ Tabela attachments existe! Total de registros:', count);
    
    // Verificar se tem campos corretos
    const sample = await prisma.attachment.findFirst();
    if (sample) {
      console.log('📋 Exemplo de registro:', JSON.stringify(sample, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
    
    // Tentar criar a tabela
    console.log('🔧 Tentando criar tabela...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS attachments (
          id TEXT PRIMARY KEY,
          "fileName" TEXT NOT NULL,
          "fileSize" INTEGER NOT NULL,
          "mimeType" TEXT NOT NULL,
          cloud_storage_path TEXT NOT NULL,
          "messageId" TEXT,
          "chatMessageId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES messages(id) ON DELETE CASCADE,
          CONSTRAINT "attachments_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES chat_messages(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS "attachments_chatMessageId_idx" ON attachments("chatMessageId");
      `);
      
      console.log('✅ Tabela criada com sucesso!');
      
      // Verificar novamente
      const count2 = await prisma.attachment.count();
      console.log('✅ Verificação - Total de registros:', count2);
      
    } catch (createError) {
      console.error('❌ Erro ao criar tabela:', createError.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkTable();
