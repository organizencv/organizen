
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MessagesContent } from '@/components/messages-content';

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams
}: {
  searchParams: { userId?: string }
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const companyId = session.user.companyId;
  const userId = session.user.id;

  // Fetch received messages, sent messages, archived messages, folders, and users
  const [receivedMessages, sentMessages, archivedMessages, folders, users] = await Promise.all([
    prisma.message.findMany({
      where: {
        companyId,
        receiverId: userId,
        archived: false,
        deleted: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.message.findMany({
      where: {
        companyId,
        senderId: userId,
        archived: false,
        deleted: false,
      },
      include: {
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.message.findMany({
      where: {
        companyId,
        archived: true,
        deleted: false,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        },
        folder: true,
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.messageFolder.findMany({
      where: {
        userId
      },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany({
      where: { 
        companyId,
        id: { not: userId } // Exclude current user
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    })
  ]);

  // Convert dates to strings for client components
  const serializedReceivedMessages = receivedMessages.map((message: any) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
  }));

  const serializedSentMessages = sentMessages.map((message: any) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
  }));

  const serializedArchivedMessages = archivedMessages.map((message: any) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
    folder: message.folder ? {
      ...message.folder,
      createdAt: message.folder.createdAt.toISOString(),
      updatedAt: message.folder.updatedAt.toISOString(),
    } : null
  }));

  const serializedFolders = folders.map((folder: any) => ({
    ...folder,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  }));

  return (
    <MessagesContent 
      receivedMessages={serializedReceivedMessages}
      sentMessages={serializedSentMessages}
      archivedMessages={serializedArchivedMessages}
      folders={serializedFolders}
      users={users}
      currentUserId={userId}
      openUserId={searchParams.userId}
    />
  );
}
