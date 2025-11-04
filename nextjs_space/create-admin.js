require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Verificar se já existe
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@organizen.cv' }
  });
  
  if (existing) {
    console.log('Usuário admin@organizen.cv já existe. Atualizando senha...');
    const updated = await prisma.user.update({
      where: { email: 'admin@organizen.cv' },
      data: {
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('Senha atualizada com sucesso!');
    console.log(updated);
  } else {
    console.log('Criando usuário admin@organizen.cv...');
    
    // Buscar ou criar empresa padrão
    let company = await prisma.company.findFirst({
      orderBy: { createdAt: 'asc' }
    });
    
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'OrganiZen',
          subdomain: 'organizen'
        }
      });
    }
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@organizen.cv',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id
      }
    });
    
    console.log('Usuário admin@organizen.cv criado com sucesso!');
    console.log(user);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
