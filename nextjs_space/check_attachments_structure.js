require('dotenv').config();
const { PrismaClient } = require('.prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar a estrutura da tabela attachments
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'attachments'
      ORDER BY ordinal_position;
    `;
    
    console.log('Estrutura da tabela attachments:');
    console.log(JSON.stringify(result, null, 2));
    
    // Verificar se há algum registro
    const count = await prisma.attachment.count();
    console.log(`\nTotal de anexos na tabela: ${count}`);
    
    // Tentar buscar uma mensagem com attachments
    console.log('\nTestando include de attachments em ChatMessage...');
    const message = await prisma.chatMessage.findFirst({
      include: {
        attachments: true
      }
    });
    console.log('✓ Include funcionou!');
    console.log('Mensagem:', message);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
