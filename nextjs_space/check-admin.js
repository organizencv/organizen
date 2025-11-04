require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'admin' } },
        { role: 'ADMIN' }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
  
  console.log('Usuários ADMIN encontrados:');
  console.log(JSON.stringify(users, null, 2));
  
  // Verificar se admin@organizen.cv existe
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@organizen.cv' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true
    }
  });
  
  console.log('\nUsuário admin@organizen.cv:');
  console.log(JSON.stringify(adminUser, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
