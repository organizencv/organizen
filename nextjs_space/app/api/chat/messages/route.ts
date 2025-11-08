
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Fetch chat messages with a specific user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const currentUserId = session.user.id;

    // Fetch messages between the two users (incluindo attachments)
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ]
      },
      include: {
        attachments: true  // NOVO: Incluir anexos
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false
      },
      data: { read: true }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send a new chat message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content, attachmentIds } = body;

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver is required' }, { status: 400 });
    }

    // Validar que há conteúdo OU anexos
    if (!content && (!attachmentIds || attachmentIds.length === 0)) {
      return NextResponse.json({ error: 'Content or attachments are required' }, { status: 400 });
    }

    // Criar mensagem
    const message = await prisma.chatMessage.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content || '', // Pode ser vazio se houver anexos
        companyId: session.user.companyId
      },
      include: {
        attachments: true
      }
    });

    // Se houver anexos, vincular à mensagem
    if (attachmentIds && attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: {
          id: { in: attachmentIds }
        },
        data: {
          chatMessageId: message.id
        }
      });

      // Recarregar mensagem com anexos
      const messageWithAttachments = await prisma.chatMessage.findUnique({
        where: { id: message.id },
        include: { attachments: true }
      });

      // Criar notificação
      const hasAttachments = messageWithAttachments?.attachments && messageWithAttachments.attachments.length > 0;
      const notificationMessage = hasAttachments
        ? `${session.user.name || session.user.email} enviou ${messageWithAttachments.attachments.length} ficheiro(s)`
        : `Você recebeu uma nova mensagem de ${session.user.name || session.user.email}`;

      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: 'Nova mensagem de chat',
          message: notificationMessage,
          type: 'CHAT',
          relatedId: message.id
        }
      });

      return NextResponse.json(messageWithAttachments, { status: 201 });
    }

    // Create notification for receiver (sem anexos)
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'Nova mensagem de chat',
        message: `Você recebeu uma nova mensagem de ${session.user.name || session.user.email}`,
        type: 'CHAT',
        relatedId: message.id
      }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
