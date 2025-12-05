
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

type TeamLevel = 'COMPANY' | 'MANAGEMENT' | 'SUPERVISION' | 'OPERATIONS';
type UserRole = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'STAFF';

// Função para obter equipas visíveis baseado no role do usuário
async function getVisibleTeams(userId: string, userRole: UserRole) {
  if (userRole === 'ADMIN') {
    // Admin vê todas as equipas
    return await prisma.team.findMany({
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        parentTeam: {
          select: {
            id: true,
            name: true
          }
        },
        childTeams: {
          select: {
            id: true,
            name: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        },
        _count: {
          select: {
            members: true,
            childTeams: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  if (userRole === 'MANAGER') {
    // Manager vê sua equipa e todas as subordinadas
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ledTeams: {
          include: {
            childTeams: {
              include: {
                childTeams: true
              }
            }
          }
        }
      }
    });

    const teamIds = new Set<string>();
    user?.ledTeams.forEach((team: any) => {
      teamIds.add(team.id);
      team.childTeams.forEach((child: any) => {
        teamIds.add(child.id);
        child.childTeams.forEach((grandChild: any) => {
          teamIds.add(grandChild.id);
        });
      });
    });

    return await prisma.team.findMany({
      where: {
        id: {
          in: Array.from(teamIds)
        }
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        parentTeam: {
          select: {
            id: true,
            name: true
          }
        },
        childTeams: {
          select: {
            id: true,
            name: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        },
        _count: {
          select: {
            members: true,
            childTeams: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  if (userRole === 'SUPERVISOR') {
    // Supervisor vê apenas sua equipa
    const ledTeams = await prisma.team.findMany({
      where: {
        leaderId: userId
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        parentTeam: {
          select: {
            id: true,
            name: true
          }
        },
        childTeams: {
          select: {
            id: true,
            name: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        },
        _count: {
          select: {
            members: true,
            childTeams: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return ledTeams;
  }

  // STAFF vê apenas sua própria equipa
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true }
  });

  if (!user?.teamId) {
    return [];
  }

  const team = await prisma.team.findUnique({
    where: { id: user.teamId },
    include: {
      leader: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true
        }
      },
      department: {
        select: {
          id: true,
          name: true
        }
      },
      parentTeam: {
        select: {
          id: true,
          name: true
        }
      },
      childTeams: {
        select: {
          id: true,
          name: true
        }
      },
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true
        }
      },
      _count: {
        select: {
          members: true,
          childTeams: true
        }
      }
    }
  });

  return team ? [team] : [];
}

// GET /api/teams - Listar equipas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const teams = await getVisibleTeams(session.user.id, user.role);

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Erro ao buscar equipas:', error);
    return NextResponse.json({ error: 'Erro ao buscar equipas' }, { status: 500 });
  }
}

// POST /api/teams - Criar equipa
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, departmentId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const data = await req.json();

    // Validar permissões baseado no role
    if (user.role === 'STAFF') {
      return NextResponse.json({ error: 'Staff não pode criar equipas' }, { status: 403 });
    }

    // Determinar o nível da equipa baseado no líder
    const leader = await prisma.user.findUnique({
      where: { id: data.leaderId },
      select: { role: true }
    });

    if (!leader) {
      return NextResponse.json({ error: 'Líder não encontrado' }, { status: 404 });
    }

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

    // Verificar permissões para criar equipas de determinado nível
    if (user.role === 'SUPERVISOR' && level !== 'OPERATIONS') {
      return NextResponse.json({ error: 'Supervisor só pode criar equipas operacionais' }, { status: 403 });
    }

    if (user.role === 'MANAGER' && level === 'COMPANY') {
      return NextResponse.json({ error: 'Manager não pode criar equipas de nível empresa' }, { status: 403 });
    }

    // Criar equipa
    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        departmentId: data.departmentId || user.departmentId,
        leaderId: data.leaderId,
        parentTeamId: (data.parentTeamId && data.parentTeamId !== 'none') ? data.parentTeamId : null,
        level: level
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar equipa:', error);
    return NextResponse.json({ error: 'Erro ao criar equipa' }, { status: 500 });
  }
}
