
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Fetch chat messages with a specific user
export async function GET(request: NextRequest) {
  try {
    console.log('[CHAT] 1. Iniciando GET messages...');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('[CHAT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CHAT] 2. Session válida:', session.user.email);

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!otherUserId) {
      console.log('[CHAT] User ID missing');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const currentUserId = session.user.id;
    console.log('[CHAT] 3. Buscando mensagens entre:', currentUserId, 'e', otherUserId);

    // Fetch messages between the two users (incluindo attachments)
    try {
      console.log('[CHAT] 4. Tentando buscar com attachments...');
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
      console.log('[CHAT] 5. ✓ Mensagens encontradas:', messages.length);

      // Mark messages as read
      await prisma.chatMessage.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: currentUserId,
          read: false
        },
        data: { read: true }
      });
      console.log('[CHAT] 6. ✓ Mensagens marcadas como lidas');

      return NextResponse.json(messages);
    } catch (prismaError: any) {
      console.error('[CHAT] ❌ Erro no Prisma:', prismaError.message);
      console.error('[CHAT] Stack:', prismaError.stack);
      throw prismaError;
    }
  } catch (error: any) {
    console.error('[CHAT] ❌ Fetch messages error:', error.message);
    console.error('[CHAT] Stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

// POST: Send a new chat message
export async function POST(request: NextRequest) {
  try {
    console.log('[CHAT] 1. Iniciando POST message...');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('[CHAT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CHAT] 2. Session válida:', session.user.email);

    const body = await request.json();
    const { receiverId, content, attachmentIds } = body;
    console.log('[CHAT] 3. Dados recebidos:', { receiverId, content, attachmentIds });

    if (!receiverId) {
      console.log('[CHAT] Receiver missing');
      return NextResponse.json({ error: 'Receiver is required' }, { status: 400 });
    }

    // Validar que há conteúdo OU anexos
    if (!content && (!attachmentIds || attachmentIds.length === 0)) {
      console.log('[CHAT] Content and attachments missing');
      return NextResponse.json({ error: 'Content or attachments are required' }, { status: 400 });
    }

    // Criar mensagem
    try {
      console.log('[CHAT] 4. Criando mensagem...');
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
      console.log('[CHAT] 5. ✓ Mensagem criada:', message.id);

      // Se houver anexos, vincular à mensagem
      if (attachmentIds && attachmentIds.length > 0) {
        console.log('[CHAT] 6. Vinculando anexos...');
        await prisma.attachment.updateMany({
          where: {
            id: { in: attachmentIds }
          },
          data: {
            chatMessageId: message.id
          }
        });
        console.log('[CHAT] 7. ✓ Anexos vinculados');

        // Recarregar mensagem com anexos
        const messageWithAttachments = await prisma.chatMessage.findUnique({
          where: { id: message.id },
          include: { attachments: true }
        });
        console.log('[CHAT] 8. ✓ Mensagem recarregada com anexos');

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
        console.log('[CHAT] 9. ✓ Notificação criada');

        return NextResponse.json(messageWithAttachments, { status: 201 });
      }

      // Create notification for receiver (sem anexos)
      console.log('[CHAT] 6. Criando notificação...');
      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: 'Nova mensagem de chat',
          message: `Você recebeu uma nova mensagem de ${session.user.name || session.user.email}`,
          type: 'CHAT',
          relatedId: message.id
        }
      });
      console.log('[CHAT] 7. ✓ Notificação criada');

      return NextResponse.json(message, { status: 201 });
    } catch (prismaError: any) {
      console.error('[CHAT] ❌ Erro no Prisma:', prismaError.message);
      console.error('[CHAT] Stack:', prismaError.stack);
      throw prismaError;
    }
  } catch (error: any) {
    console.error('[CHAT] ❌ Send message error:', error.message);
    console.error('[CHAT] Stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
