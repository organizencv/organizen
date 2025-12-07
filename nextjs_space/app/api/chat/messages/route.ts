
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch chat messages with a specific user or group
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!otherUserId && !groupId) {
      return NextResponse.json({ error: 'User ID or Group ID is required' }, { status: 400 });
    }

    const currentUserId = session.user.id;

    let messages: any;
    
    if (groupId) {
      // Fetch messages from group
      const rawMessages = await prisma.chatMessage.findMany({
        where: {
          groupId
        },
        orderBy: { createdAt: 'asc' },
        take: limit
      });

      // Buscar dados dos remetentes
      const senderIds = [...new Set(rawMessages.map((m: { senderId: string }) => m.senderId))];
      const senders = await prisma.user.findMany({
        where: {
          id: { in: senderIds }
        },
        select: {
          id: true,
          name: true,
          image: true
        }
      });

      const senderMap = new Map(senders.map((s: { id: string; name: string; image: string | null }) => [s.id, s]));

      messages = rawMessages.map(msg => ({
        ...msg,
        sender: senderMap.get(msg.senderId) || { id: msg.senderId, name: 'Unknown', image: null }
      }));
    } else if (otherUserId) {
      // Fetch messages between the two users
      const rawMessages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { 
              senderId: currentUserId, 
              receiverId: otherUserId 
            },
            { 
              senderId: otherUserId, 
              receiverId: currentUserId 
            }
          ]
        },
        orderBy: { createdAt: 'asc' },
        take: limit
      });

      // Buscar dados dos remetentes
      const senderIds = [...new Set(rawMessages.map((m: { senderId: string }) => m.senderId))];
      const senders = await prisma.user.findMany({
        where: {
          id: { in: senderIds }
        },
        select: {
          id: true,
          name: true,
          image: true
        }
      });

      const senderMap = new Map(senders.map((s: { id: string; name: string; image: string | null }) => [s.id, s]));

      messages = rawMessages.map(msg => ({
        ...msg,
        sender: senderMap.get(msg.senderId) || { id: msg.senderId, name: 'Unknown', image: null }
      }));

      // Mark messages as read
      await prisma.chatMessage.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: currentUserId,
          read: false
        },
        data: { read: true }
      });
    }

    return NextResponse.json(messages || []);
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
    const { receiverId, content, groupId, attachmentUrl, attachmentType, attachmentName, attachmentSize } = body;

    if (!receiverId && !groupId) {
      return NextResponse.json({ error: 'Receiver or group is required' }, { status: 400 });
    }

    if (!content && !attachmentUrl) {
      return NextResponse.json({ error: 'Content or attachment is required' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: session.user.id,
        receiverId,
        groupId,
        content: content || '',
        companyId: session.user.companyId,
        attachmentUrl,
        attachmentType,
        attachmentName,
        attachmentSize
      }
    });

    // Create notification for receiver (only for direct messages)
    if (receiverId) {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: 'Nova mensagem de chat',
          message: `Você recebeu uma nova mensagem de ${session.user.name || session.user.email}`,
          type: 'CHAT',
          relatedId: message.id
        }
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
