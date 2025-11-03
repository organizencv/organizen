
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyTimeOffRequest } from '@/lib/notification-triggers';

// GET - Listar solicitações de folga
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { team: true, department: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    let requests;

    // Se for MANAGER ou ADMIN, mostra todas as solicitações da equipe/departamento
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
      const teamIds = user.role === 'ADMIN' 
        ? (await prisma.team.findMany({ where: { departmentId: user.departmentId || undefined } })).map((t: { id: string }) => t.id)
        : user.teamId ? [user.teamId] : [];

      requests = await prisma.timeOffRequest.findMany({
        where: {
          user: {
            teamId: teamIds.length > 0 ? { in: teamIds } : undefined
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              team: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // STAFF vê apenas suas próprias solicitações
      requests = await prisma.timeOffRequest.findMany({
        where: {
          userId: user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              team: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching time-off requests:', error);
    return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 });
  }
}

// POST - Criar nova solicitação de folga
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, startDate, endDate, reason } = body;

    // Validar datas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return NextResponse.json(
        { error: 'Data de início deve ser anterior à data de fim' },
        { status: 400 }
      );
    }

    // Criar a solicitação
    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        userId: session.user.id,
        type: type || 'VACATION',
        startDate: start,
        endDate: end,
        reason: reason || null,
        status: 'PENDING'
      }
    });

    // Enviar notificação para o gestor da equipe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        teamId: true
      }
    });

    if (user?.teamId) {
      const manager = await prisma.user.findFirst({
        where: {
          teamId: user.teamId,
          role: 'MANAGER'
        }
      });

      if (manager) {
        notifyTimeOffRequest({
          managerId: manager.id,
          requesterId: session.user.id,
          requesterName: user.name || 'Usuário',
          requestId: timeOffRequest.id,
          type,
          startDate: start,
          endDate: end,
          reason
        }).catch(err => console.error('Error sending time-off notification:', err));
      }
    }

    return NextResponse.json(timeOffRequest);
  } catch (error) {
    console.error('Error creating time-off request:', error);
    return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 });
  }
}
