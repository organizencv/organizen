
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/teams/:id - Obter detalhes de uma equipa
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.id },
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
            name: true,
            leader: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        childTeams: {
          select: {
            id: true,
            name: true,
            level: true,
            leader: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            _count: {
              select: {
                members: true
              }
            }
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

    if (!team) {
      return NextResponse.json({ error: 'Equipa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Erro ao buscar equipa:', error);
    return NextResponse.json({ error: 'Erro ao buscar equipa' }, { status: 500 });
  }
}

// PUT /api/teams/:id - Atualizar equipa
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // STAFF não pode atualizar equipas
    if (user.role === 'STAFF') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();

    // Verificar se equipa existe
    const team = await prisma.team.findUnique({
      where: { id: params.id }
    });

    if (!team) {
      return NextResponse.json({ error: 'Equipa não encontrada' }, { status: 404 });
    }

    // Atualizar equipa
    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        leaderId: data.leaderId,
        parentTeamId: data.parentTeamId
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

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Erro ao atualizar equipa:', error);
    return NextResponse.json({ error: 'Erro ao atualizar equipa' }, { status: 500 });
  }
}

// DELETE /api/teams/:id - Excluir equipa
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Apenas ADMIN e MANAGER podem excluir equipas
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se equipa existe e obter dados completos
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: {
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
        leader: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Equipa não encontrada' }, { status: 404 });
    }

    // Mover todos os membros para lista de espera (teamId = null)
    if (team.members.length > 0) {
      await prisma.user.updateMany({
        where: { teamId: params.id },
        data: { teamId: null }
      });
    }

    // Remover vínculo de sub-equipas (mantém as equipas, apenas remove parentTeamId)
    if (team.childTeams.length > 0) {
      await prisma.team.updateMany({
        where: { parentTeamId: params.id },
        data: { parentTeamId: null }
      });
    }

    // Deletar a equipa
    await prisma.team.delete({
      where: { id: params.id }
    });

    // Preparar resposta com informações sobre o que foi feito
    const movedToWaitingList = team.members.map((m: any) => m.name);
    if (team.leaderId && team.leader) {
      // Se o líder não estava na lista de membros, adicionar
      const leaderInMembers = team.members.some((m: any) => m.id === team.leaderId);
      if (!leaderInMembers) {
        movedToWaitingList.push(team.leader.name);
      }
    }

    return NextResponse.json({ 
      message: 'Equipa excluída com sucesso',
      movedToWaitingList,
      subteamsUnlinked: team.childTeams.map((st: any) => st.name)
    });
  } catch (error) {
    console.error('Erro ao excluir equipa:', error);
    return NextResponse.json({ error: 'Erro ao excluir equipa' }, { status: 500 });
  }
}

// PATCH /api/teams/:id - Vincular equipa como sub-equipa (apenas atualiza parentTeamId)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Apenas ADMIN e MANAGER podem vincular equipas
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();

    if (!data.parentTeamId) {
      return NextResponse.json({ error: 'parentTeamId é obrigatório' }, { status: 400 });
    }

    // Verificar se a equipa a ser vinculada existe
    const teamToLink = await prisma.team.findFirst({
      where: {
        id: params.id,
        department: {
          companyId: user.companyId
        }
      },
      include: {
        department: true,
        leader: {
          select: {
            role: true
          }
        }
      }
    });

    if (!teamToLink) {
      return NextResponse.json({ error: 'Equipa não encontrada' }, { status: 404 });
    }

    // Verificar se a equipa já tem um pai
    if (teamToLink.parentTeamId) {
      return NextResponse.json({ 
        error: 'Esta equipa já está vinculada a outra equipa. Remova o vínculo existente primeiro.' 
      }, { status: 400 });
    }

    // Verificar se a equipa pai existe
    const parentTeam = await prisma.team.findFirst({
      where: {
        id: data.parentTeamId,
        department: {
          companyId: user.companyId
        }
      },
      include: {
        department: true
      }
    });

    if (!parentTeam) {
      return NextResponse.json({ error: 'Equipa pai não encontrada' }, { status: 404 });
    }

    // Verificar se ambas pertencem ao mesmo departamento
    if (teamToLink.departmentId !== parentTeam.departmentId) {
      return NextResponse.json({ 
        error: 'Apenas equipas do mesmo departamento podem ser vinculadas' 
      }, { status: 400 });
    }

    // Verificar hierarquia de níveis
    const levelHierarchy: { [key: string]: number } = {
      'COMPANY': 1,
      'MANAGEMENT': 2,
      'SUPERVISION': 3,
      'OPERATIONS': 4
    };

    const parentLevel = levelHierarchy[parentTeam.level] || 0;
    const childLevel = levelHierarchy[teamToLink.level] || 0;

    if (childLevel <= parentLevel) {
      return NextResponse.json({ 
        error: 'A equipa a ser vinculada deve ser de nível hierárquico inferior à equipa pai' 
      }, { status: 400 });
    }

    // Evitar ciclos: verificar se a equipa pai não é uma sub-equipa da equipa a vincular
    let currentTeam = parentTeam;
    while (currentTeam.parentTeamId) {
      if (currentTeam.parentTeamId === params.id) {
        return NextResponse.json({ 
          error: 'Não é possível criar ciclos na hierarquia de equipas' 
        }, { status: 400 });
      }
      const nextTeam = await prisma.team.findUnique({
        where: { id: currentTeam.parentTeamId },
        include: {
          department: true
        }
      });
      if (!nextTeam) break;
      currentTeam = nextTeam;
    }

    // Atualizar a equipa para adicionar o parentTeamId
    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: {
        parentTeamId: data.parentTeamId
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

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Erro ao vincular equipa:', error);
    return NextResponse.json({ error: 'Erro ao vincular equipa' }, { status: 500 });
  }
}
