
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/events/[id]/chat - Obter mensagens do chat do evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário é colaborador com permissão de chat
    const collaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId: params.id,
        userId: session.user.id,
        canChat: true,
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: 'You must be a collaborator with chat permission' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Timestamp para paginação

    const where: any = {
      eventId: params.id,
    };

    if (before) {
      where.createdAt = {
        lt: new Date(before),
      };
    }

    const messages = await prisma.eventChatMessage.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Buscar informações dos remetentes
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const senders = await prisma.user.findMany({
      where: {
        id: { in: senderIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    const messagesWithSenders = messages.map(msg => {
      const sender = senders.find(s => s.id === msg.senderId);
      return {
        ...msg,
        sender,
      };
    }).reverse(); // Ordenar cronologicamente para exibição

    return NextResponse.json(messagesWithSenders);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/chat - Enviar mensagem no chat
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário é colaborador com permissão de chat
    const collaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId: params.id,
        userId: session.user.id,
        canChat: true,
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: 'You must be a collaborator with chat permission' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, attachmentUrl, attachmentType, attachmentName, attachmentSize } = body;

    // Validar: precisa ter conteúdo OU anexo
    if ((!content || content.trim().length === 0) && !attachmentUrl) {
      return NextResponse.json(
        { error: 'Message content or attachment is required' },
        { status: 400 }
      );
    }

    const message = await prisma.eventChatMessage.create({
      data: {
        eventId: params.id,
        senderId: session.user.id,
        content: content?.trim() || '',
        attachmentUrl,
        attachmentType,
        attachmentName,
        attachmentSize,
      },
    });

    // Buscar informações do remetente
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        ...message,
        sender,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
