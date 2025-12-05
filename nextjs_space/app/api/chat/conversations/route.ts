
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
    const usersData = await prisma.user.findMany({
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

    // Convert enum to string for proper serialization
    const users = usersData.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role as string
    }));

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

// POST: Create a new group conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const companyId = session.user.companyId;
    const body = await request.json();
    
    const { name, isGroup, memberIds } = body;

    if (!name || !memberIds || memberIds.length === 0) {
      return NextResponse.json({ 
        error: 'Group name and members are required' 
      }, { status: 400 });
    }

    // Criar o grupo
    const group = await prisma.chatGroup.create({
      data: {
        name,
        companyId,
        createdById: currentUserId,
        isActive: true
      }
    });

    // Adicionar membros (incluindo o criador)
    const allMemberIds = [currentUserId, ...memberIds];
    const uniqueMemberIds = [...new Set(allMemberIds)];

    await prisma.chatGroupMember.createMany({
      data: uniqueMemberIds.map(userId => ({
        groupId: group.id,
        userId,
        role: userId === currentUserId ? 'admin' : 'member'
      }))
    });

    // Buscar dados dos membros para retornar
    const members = await prisma.user.findMany({
      where: {
        id: { in: uniqueMemberIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      }
    });

    // Buscar memberships criados
    const memberships = await prisma.chatGroupMember.findMany({
      where: {
        groupId: group.id
      }
    });

    // Retornar a conversa no formato esperado pelo frontend
    const conversation = {
      id: group.id,
      name: group.name,
      isGroup: true,
      isMuted: false,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      participants: memberships.map(m => {
        const user = members.find(u => u.id === m.userId);
        return {
          id: m.id,
          userId: m.userId,
          role: m.role || 'member',
          joinedAt: m.joinedAt.toISOString(),
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role as string
          } : {
            id: m.userId,
            name: 'Unknown',
            email: '',
            image: null,
            role: 'STAFF'
          }
        };
      }),
      lastMessage: null,
      pinnedMessage: null,
      unreadCount: 0
    };

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ 
      error: 'Failed to create group' 
    }, { status: 500 });
  }
}

// DELETE: Delete a conversation or group
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const companyId = session.user.companyId;
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Para conversas individuais
    const groupId = searchParams.get('groupId'); // Para grupos

    // Caso 1: Eliminar conversa individual (todas as mensagens entre dois usuários)
    if (userId) {
      await prisma.chatMessage.deleteMany({
        where: {
          companyId,
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
          ]
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Conversation deleted successfully' 
      });
    }

    // Caso 2: Eliminar grupo
    if (groupId) {
      // Verificar se o usuário é membro do grupo
      const membership = await prisma.chatGroupMember.findFirst({
        where: {
          groupId,
          userId: currentUserId
        }
      });

      if (!membership) {
        return NextResponse.json({ 
          error: 'You are not a member of this group' 
        }, { status: 403 });
      }

      // Verificar se é admin do grupo ou se o grupo pertence à mesma empresa
      const group = await prisma.chatGroup.findFirst({
        where: {
          id: groupId,
          companyId
        }
      });

      if (!group) {
        return NextResponse.json({ 
          error: 'Group not found' 
        }, { status: 404 });
      }

      // Apenas admins do grupo ou criadores podem eliminar
      const isAdmin = membership.role === 'admin' || group.createdById === currentUserId;
      
      if (!isAdmin) {
        return NextResponse.json({ 
          error: 'Only group admins can delete the group' 
        }, { status: 403 });
      }

      // Eliminar todas as mensagens do grupo
      await prisma.chatMessage.deleteMany({
        where: {
          groupId
        }
      });

      // Eliminar todos os membros do grupo
      await prisma.chatGroupMember.deleteMany({
        where: {
          groupId
        }
      });

      // Eliminar o grupo
      await prisma.chatGroup.delete({
        where: {
          id: groupId
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Group deleted successfully' 
      });
    }

    return NextResponse.json({ 
      error: 'userId or groupId is required' 
    }, { status: 400 });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete conversation' 
    }, { status: 500 });
  }
}
