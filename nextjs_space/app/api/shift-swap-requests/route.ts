
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyShiftSwapRequest } from '@/lib/notification-triggers';

// GET - Listar solicitações de troca de turno
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

      requests = await prisma.shiftSwapRequest.findMany({
        where: {
          requester: {
            teamId: teamIds.length > 0 ? { in: teamIds } : undefined
          }
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              team: { select: { name: true } }
            }
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // STAFF vê apenas suas próprias solicitações
      requests = await prisma.shiftSwapRequest.findMany({
        where: {
          OR: [
            { requesterId: user.id },
            { targetUserId: user.id }
          ]
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              team: { select: { name: true } }
            }
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching shift swap requests:', error);
    return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 });
  }
}

// POST - Criar nova solicitação de troca de turno
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { originalShiftId, targetUserId, offeredShiftId, reason } = body;

    // Criar a solicitação
    const shiftSwapRequest = await prisma.shiftSwapRequest.create({
      data: {
        requesterId: session.user.id,
        originalShiftId,
        targetUserId: targetUserId || null,
        offeredShiftId: offeredShiftId || null,
        reason: reason || null,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            team: { select: { name: true } }
          }
        }
      }
    });

    // Enviar notificação para o usuário alvo (se especificado) ou para o gestor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Buscar data do turno original
    const originalShift = await prisma.shift.findUnique({
      where: { id: originalShiftId },
      select: { startTime: true }
    });

    if (targetUserId && originalShift) {
      // Notificar o usuário alvo
      notifyShiftSwapRequest({
        targetUserId,
        requesterId: session.user.id,
        requesterName: user?.name || 'Usuário',
        requestId: shiftSwapRequest.id,
        shiftDate: originalShift.startTime,
        reason
      }).catch(err => console.error('Error sending shift swap notification:', err));
    } else if (user?.teamId && originalShift) {
      // Notificar o gestor da equipe
      const manager = await prisma.user.findFirst({
        where: {
          teamId: user.teamId,
          role: 'MANAGER'
        }
      });

      if (manager) {
        notifyShiftSwapRequest({
          targetUserId: manager.id,
          requesterId: session.user.id,
          requesterName: user?.name || 'Usuário',
          requestId: shiftSwapRequest.id,
          shiftDate: originalShift.startTime,
          reason
        }).catch(err => console.error('Error sending shift swap notification:', err));
      }
    }

    return NextResponse.json(shiftSwapRequest);
  } catch (error) {
    console.error('Error creating shift swap request:', error);
    return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 });
  }
}
