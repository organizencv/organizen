
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';



export const dynamic = 'force-dynamic';

// GET: Fetch all conversations (users with chat history)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const companyId = session.user.companyId;

    // Get all messages where user is sender or receiver
    const messages = await prisma.chatMessage.findMany({
      where: {
        companyId,
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // Extract unique user IDs and get the latest message for each conversation
    const conversationMap = new Map<string, any>();

    messages.forEach((msg: any) => {
      const otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: msg,
          unreadCount: 0
        });
      }

      // Count unread messages from the other user
      if (msg.receiverId === currentUserId && !msg.read) {
        conversationMap.get(otherUserId)!.unreadCount++;
      }
    });

    // Fetch user details for each conversation
    const userIds = Array.from(conversationMap.keys());
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      }
    });

    // Get online status for users
    const userStatuses = await prisma.userStatus.findMany({
      where: {
        userId: { in: userIds }
      }
    });

    const statusMap = new Map(userStatuses.map((s: any) => [s.userId, s]));

    // Combine data
    const conversations = users.map((user: any) => {
      const conv = conversationMap.get(user.id)!;
      const status = statusMap.get(user.id);
      
      return {
        user,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount,
        status: status ? {
          isOnline: (status as any).isOnline,
          lastSeen: (status as any).lastSeen,
          isTyping: (status as any).isTyping && (status as any).typingTo === currentUserId
        } : {
          isOnline: false,
          lastSeen: null,
          isTyping: false
        }
      };
    });

    // Sort by last message timestamp
    conversations.sort((a: any, b: any) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
