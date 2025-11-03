
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test company
  const testCompany = await prisma.company.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      name: 'Empresa Teste',
      email: 'john@doe.com',
      defaultLanguage: 'pt',
      timezone: 'Europe/Lisbon',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      firstDayOfWeek: 1, // Segunda-feira
      currency: 'EUR',
    },
  });

  // Create default test admin user
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  // Create sample departments
  const itDepartment = await prisma.department.create({
    data: {
      name: 'Tecnologia',
      companyId: testCompany.id,
    },
  });

  const hrDepartment = await prisma.department.create({
    data: {
      name: 'Recursos Humanos',
      companyId: testCompany.id,
    },
  });

  // Create sample teams
  const devTeam = await prisma.team.create({
    data: {
      name: 'Desenvolvimento',
      departmentId: itDepartment.id,
    },
  });

  const hrTeam = await prisma.team.create({
    data: {
      name: 'Gestão',
      departmentId: hrDepartment.id,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      name: 'John Doe Admin',
      email: 'john@doe.com',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: testCompany.id,
      departmentId: itDepartment.id,
      teamId: devTeam.id,
      language: 'pt',
    },
  });

  // Create sample users
  const managerUser = await prisma.user.create({
    data: {
      name: 'Maria Silva',
      email: 'maria@teste.com',
      password: await bcrypt.hash('maria123', 12),
      role: 'MANAGER',
      companyId: testCompany.id,
      departmentId: itDepartment.id,
      teamId: devTeam.id,
      language: 'pt',
    },
  });

  const supervisorUser = await prisma.user.create({
    data: {
      name: 'Carlos Santos',
      email: 'carlos@teste.com',
      password: await bcrypt.hash('carlos123', 12),
      role: 'SUPERVISOR',
      companyId: testCompany.id,
      departmentId: itDepartment.id,
      teamId: devTeam.id,
      language: 'pt',
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: 'Ana Costa',
      email: 'ana@teste.com',
      password: await bcrypt.hash('ana123', 12),
      role: 'STAFF',
      companyId: testCompany.id,
      departmentId: itDepartment.id,
      teamId: devTeam.id,
      language: 'pt',
    },
  });

  // Create sample shifts
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(17, 0, 0, 0);

  await prisma.shift.create({
    data: {
      title: 'Turno Manhã',
      description: 'Turno da manhã para desenvolvimento',
      startTime: tomorrow,
      endTime: tomorrowEnd,
      userId: staffUser.id,
      companyId: testCompany.id,
    },
  });

  // Create sample tasks
  await prisma.task.create({
    data: {
      title: 'Revisar código do projeto',
      description: 'Revisar código da nova funcionalidade',
      dueDate: tomorrow,
      status: 'PENDING',
      userId: staffUser.id,
      companyId: testCompany.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Preparar relatório mensal',
      description: 'Preparar relatório de atividades do mês',
      dueDate: tomorrow,
      status: 'IN_PROGRESS',
      userId: supervisorUser.id,
      companyId: testCompany.id,
    },
  });

  // Create sample messages
  await prisma.message.create({
    data: {
      subject: 'Bem-vindo ao OrganiZen',
      content: 'Esta é uma mensagem de boas-vindas ao sistema OrganiZen. Explore todas as funcionalidades disponíveis.',
      senderId: adminUser.id,
      receiverId: staffUser.id,
      companyId: testCompany.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
