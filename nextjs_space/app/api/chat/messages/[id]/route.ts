

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Buscar mensagem de chat específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const chatMessage = await prisma.chatMessage.findFirst({
      where: {
        id: params.id,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      }
    });

    if (!chatMessage) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }

    // Buscar informações do remetente e destinatário separadamente
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: chatMessage.senderId },
        select: { id: true, name: true, email: true, role: true }
      }),
      chatMessage.receiverId
        ? prisma.user.findUnique({
            where: { id: chatMessage.receiverId },
            select: { id: true, name: true, email: true, role: true }
          })
        : Promise.resolve(null)
    ]);

    return NextResponse.json({
      ...chatMessage,
      sender,
      receiver
    });
  } catch (error) {
    console.error('Error fetching chat message:', error);
    return NextResponse.json({ error: 'Erro ao buscar mensagem' }, { status: 500 });
  }
}
