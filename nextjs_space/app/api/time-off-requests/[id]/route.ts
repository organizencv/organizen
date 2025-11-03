
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyTimeOffResponse } from '@/lib/notification-triggers';

// PATCH - Aprovar ou recusar solicitação
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Apenas MANAGER e ADMIN podem aprovar/recusar
    if (user?.role !== 'MANAGER' && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { status, responseMessage } = body;

    const updatedRequest = await prisma.timeOffRequest.update({
      where: { id: params.id },
      data: {
        status,
        responseMessage: responseMessage || null,
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Enviar notificação para o solicitante
    notifyTimeOffResponse({
      userId: updatedRequest.userId,
      approverName: user?.name || 'Gestor',
      requestId: updatedRequest.id,
      status: status === 'APPROVED' ? 'approved' : 'rejected',
      type: updatedRequest.type,
      startDate: updatedRequest.startDate,
      endDate: updatedRequest.endDate
    }).catch(err => console.error('Error sending time-off response notification:', err));

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating time-off request:', error);
    return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 });
  }
}

// DELETE - Cancelar solicitação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id: params.id }
    });

    if (!timeOffRequest) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    // Apenas o solicitante pode cancelar sua própria solicitação
    if (timeOffRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    await prisma.timeOffRequest.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Solicitação cancelada' });
  } catch (error) {
    console.error('Error deleting time-off request:', error);
    return NextResponse.json({ error: 'Erro ao cancelar solicitação' }, { status: 500 });
  }
}
