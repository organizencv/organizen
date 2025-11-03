import { PrismaClient } from '@prisma/client';
type TeamLevel = 'COMPANY' | 'MANAGEMENT' | 'SUPERVISION' | 'OPERATIONS';
type UserRole = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'STAFF';

const prisma = new PrismaClient();

async function migrateTeams() {
  console.log('🔄 Iniciando migração de equipas...');

  try {
    // Obter todas as equipas
    const teams = await prisma.team.findMany({
      include: {
        members: true,
        department: true
      }
    });

    console.log(`📊 Encontradas ${teams.length} equipas para migrar`);

    for (const team of teams) {
      console.log(`\n🔧 Processando equipa: ${team.name}`);

      // Verificar se já tem líder
      if (team.leaderId) {
        console.log(`✅ Equipa já tem líder definido`);
        continue;
      }

      // Procurar líder entre os membros (prioridade: ADMIN > MANAGER > SUPERVISOR)
      const leader = team.members.find((u: any) => u.role === 'ADMIN') ||
                    team.members.find((u: any) => u.role === 'MANAGER') ||
                    team.members.find((u: any) => u.role === 'SUPERVISOR');

      if (!leader) {
        console.log(`⚠️  Nenhum líder encontrado para equipa ${team.name}`);
        continue;
      }

      // Determinar o nível da equipa baseado no role do líder
      let level: TeamLevel;
      switch (leader.role) {
        case 'ADMIN':
          level = 'COMPANY';
          break;
        case 'MANAGER':
          level = 'MANAGEMENT';
          break;
        case 'SUPERVISOR':
          level = 'SUPERVISION';
          break;
        default:
          level = 'OPERATIONS';
      }

      // Atualizar equipa
      await prisma.team.update({
        where: { id: team.id },
        data: {
          leaderId: leader.id,
          level: level,
          parentTeamId: null // Por enquanto, sem hierarquia
        }
      });

      console.log(`✅ Equipa ${team.name} atualizada:`);
      console.log(`   - Líder: ${leader.name} (${leader.role})`);
      console.log(`   - Nível: ${level}`);
    }

    // Criar equipas para Admins que não têm equipa
    const adminsWithoutTeam = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        ledTeams: {
          none: {}
        }
      },
      include: {
        department: true
      }
    });

    console.log(`\n👑 Encontrados ${adminsWithoutTeam.length} admins sem equipa`);

    for (const admin of adminsWithoutTeam) {
      const teamName = `Equipa de ${admin.name || 'Admin'}`;
      
      // Pular admin sem departamento
      if (!admin.departmentId) {
        console.log(`⚠️  Admin ${admin.name} não tem departamento`);
        continue;
      }

      const existingTeam = await prisma.team.findFirst({
        where: { 
          name: teamName,
          departmentId: admin.departmentId
        }
      });

      if (existingTeam) {
        console.log(`⚠️  Equipa "${teamName}" já existe`);
        continue;
      }

      await prisma.team.create({
        data: {
          name: teamName,
          description: `Equipa liderada por ${admin.name}`,
          departmentId: admin.departmentId,
          leaderId: admin.id,
          level: 'COMPANY',
          parentTeamId: null
        }
      });

      console.log(`✅ Criada equipa "${teamName}" para admin ${admin.name}`);
    }

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateTeams()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
