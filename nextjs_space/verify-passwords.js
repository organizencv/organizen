require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyPasswords() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        password: true
      },
      orderBy: { email: 'asc' }
    });
    
    console.log('\n=== VERIFICAÇÃO DE SENHAS ===\n');
    console.log(`Total de usuários: ${users.length}\n`);
    
    for (const user of users) {
      const isValid = await bcrypt.compare('teste123', user.password);
      const status = isValid ? '✅ CORRETO' : '❌ INCORRETO';
      console.log(`${status} | ${user.email} | ${user.name} (${user.role})`);
    }
    
    console.log('\n=== RESUMO ===');
    const allValid = users.every(async (u) => await bcrypt.compare('teste123', u.password));
    
    // Verificar cada um individualmente
    let validCount = 0;
    for (const user of users) {
      const isValid = await bcrypt.compare('teste123', user.password);
      if (isValid) validCount++;
    }
    
    console.log(`${validCount}/${users.length} senhas válidas para "teste123"`);
    
    if (validCount === users.length) {
      console.log('\n✅ TODAS AS SENHAS ESTÃO CORRETAS!\n');
    } else {
      console.log('\n❌ ALGUMAS SENHAS ESTÃO INCORRETAS!\n');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPasswords();
