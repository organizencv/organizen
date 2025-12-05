
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ChatGroupContent } from '@/components/chat-group-content';

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams
}: {
  searchParams: { conversationId?: string }
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const companyId = session.user.companyId;
  const userId = session.user.id;
  const userRole = session.user.role;

  // Fetch all users in the company
  const usersData = await prisma.user.findMany({
    where: { 
      companyId,
      id: { not: userId }
    },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true,
      image: true
    },
    orderBy: { name: 'asc' }
  });

  // Convert enum to string for proper serialization
  const users = usersData.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as string,
    image: user.image
  }));

  // Buscar conversas diretas (1:1) - mensagens onde o usuário é remetente ou destinatário
  const directMessages = await prisma.chatMessage.findMany({
    where: {
      companyId,
      groupId: null, // Apenas mensagens diretas (não de grupo)
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  // Buscar dados dos senders
  const senderIds = [...new Set(directMessages.map(m => m.senderId))];
  const senders = await prisma.user.findMany({
    where: {
      id: { in: senderIds }
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true
    }
  });

  const senderMap = new Map(senders.map(s => [s.id, s]));

  // Agrupar mensagens por conversa (combinação de sender/receiver)
  const directConversationsMap = new Map<string, any>();

  directMessages.forEach(msg => {
    const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!otherUserId) return;

    const conversationKey = [userId, otherUserId].sort().join('_');
    
    if (!directConversationsMap.has(conversationKey)) {
      const otherUser = usersData.find(u => u.id === otherUserId);
      if (otherUser) {
        directConversationsMap.set(conversationKey, {
          id: conversationKey,
          name: otherUser.name,
          isGroup: false,
          isMuted: false,
          createdAt: msg.createdAt.toISOString(),
          updatedAt: msg.updatedAt.toISOString(),
          participants: [
            {
              id: `p_${userId}`,
              userId: userId,
              role: 'member',
              joinedAt: msg.createdAt.toISOString(),
              user: {
                id: userId,
                name: session.user.name || session.user.email || 'User',
                email: session.user.email || '',
                image: session.user.image || null,
                role: userRole as string
              }
            },
            {
              id: `p_${otherUserId}`,
              userId: otherUserId,
              role: 'member',
              joinedAt: msg.createdAt.toISOString(),
              user: {
                id: otherUser.id,
                name: otherUser.name,
                email: otherUser.email,
                image: otherUser.image,
                role: otherUser.role as string
              }
            }
          ],
          lastMessage: {
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            conversationId: conversationKey,
            read: msg.read,
            attachmentType: msg.attachmentType,
            attachmentUrl: msg.attachmentUrl,
            attachmentName: msg.attachmentName,
            createdAt: msg.createdAt.toISOString(),
            sender: senderMap.get(msg.senderId) ? {
              id: senderMap.get(msg.senderId)!.id,
              name: senderMap.get(msg.senderId)!.name,
              image: senderMap.get(msg.senderId)!.image
            } : undefined
          },
          pinnedMessage: null,
          unreadCount: msg.senderId !== userId && !msg.read ? 1 : 0
        });
      }
    } else {
      // Atualizar a última mensagem se for mais recente
      const existing = directConversationsMap.get(conversationKey);
      if (new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
        existing.lastMessage = {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          conversationId: conversationKey,
          read: msg.read,
          attachmentType: msg.attachmentType,
          attachmentUrl: msg.attachmentUrl,
          attachmentName: msg.attachmentName,
          createdAt: msg.createdAt.toISOString(),
          sender: senderMap.get(msg.senderId) ? {
            id: senderMap.get(msg.senderId)!.id,
            name: senderMap.get(msg.senderId)!.name,
            image: senderMap.get(msg.senderId)!.image
          } : undefined
        };
        existing.updatedAt = msg.updatedAt.toISOString();
      }
      // Contar mensagens não lidas
      if (msg.senderId !== userId && !msg.read) {
        existing.unreadCount = (existing.unreadCount || 0) + 1;
      }
    }
  });

  const directConversations = Array.from(directConversationsMap.values());

  // Buscar grupos
  const groups = await prisma.chatGroup.findMany({
    where: {
      companyId,
      isActive: true
    }
  });

  // Buscar membros de grupos onde o utilizador participa
  const userGroupMemberships = await prisma.chatGroupMember.findMany({
    where: {
      userId,
      groupId: { in: groups.map(g => g.id) }
    }
  });

  const userGroupIds = userGroupMemberships.map(m => m.groupId);

  // Buscar todas as mensagens de grupos do utilizador
  const groupMessages = await prisma.chatMessage.findMany({
    where: {
      companyId,
      groupId: { in: userGroupIds }
    },
    orderBy: { createdAt: 'desc' },
    take: userGroupIds.length // Uma mensagem por grupo
  });

  // Buscar membros de todos os grupos do utilizador
  const allGroupMembers = await prisma.chatGroupMember.findMany({
    where: {
      groupId: { in: userGroupIds }
    }
  });

  // Buscar dados dos utilizadores membros
  const memberUserIds = [...new Set(allGroupMembers.map(m => m.userId))];
  const memberUsers = await prisma.user.findMany({
    where: {
      id: { in: memberUserIds }
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true
    }
  });

  const userMap = new Map(memberUsers.map(u => [u.id, u]));

  // Serializar conversas de grupo
  const groupConversations = groups
    .filter(g => userGroupIds.includes(g.id))
    .map(group => {
      const groupMembers = allGroupMembers.filter(m => m.groupId === group.id);
      const lastMsg = groupMessages.find(m => m.groupId === group.id);
      const currentMembership = userGroupMemberships.find(m => m.groupId === group.id);

      return {
        id: group.id,
        name: group.name,
        isGroup: true,
        isMuted: currentMembership?.isMuted || false,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
        participants: groupMembers.map(m => {
          const user = userMap.get(m.userId);
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
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          content: lastMsg.content,
          senderId: lastMsg.senderId,
          conversationId: lastMsg.groupId || '',
          read: lastMsg.read,
          attachmentType: lastMsg.attachmentType,
          attachmentUrl: lastMsg.attachmentUrl,
          attachmentName: lastMsg.attachmentName,
          createdAt: lastMsg.createdAt.toISOString(),
          sender: {
            id: lastMsg.senderId,
            name: userMap.get(lastMsg.senderId)?.name || 'Unknown',
            image: userMap.get(lastMsg.senderId)?.image
          }
        } : null,
        pinnedMessage: null,
        unreadCount: 0
      };
    });

  // Combinar conversas diretas e grupos, ordenar por última mensagem
  const allConversations = [...directConversations, ...groupConversations]
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  return (
    <ChatGroupContent 
      users={users}
      currentUserId={userId}
      currentUserName={session.user.name || session.user.email || 'User'}
      currentUserRole={userRole}
      openConversationId={searchParams.conversationId}
      initialConversations={allConversations}
    />
  );
}
