
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Buscar mensagem específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const message = await prisma.message.findFirst({
      where: {
        id: params.id,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        },
        attachments: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json({ error: 'Erro ao buscar mensagem' }, { status: 500 });
  }
}

// PATCH - Atualizar status de leitura
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { read } = body;

    if (typeof read !== 'boolean') {
      return NextResponse.json({ error: 'Campo "read" deve ser booleano' }, { status: 400 });
    }

    // Verificar se a mensagem existe e se o usuário é o destinatário
    const message = await prisma.message.findFirst({
      where: {
        id: params.id,
        receiverId: session.user.id
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada ou você não tem permissão para modificá-la' },
        { status: 404 }
      );
    }

    // Atualizar status de leitura
    const updatedMessage = await prisma.message.update({
      where: { id: params.id },
      data: { read },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        },
        attachments: true
      }
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message read status:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status de leitura' }, { status: 500 });
  }
}
