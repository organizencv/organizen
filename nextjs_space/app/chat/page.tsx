
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ChatContent } from '@/components/chat-content';

export const dynamic = "force-dynamic";

export default async function ChatPage({
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

  // Fetch all users in the company except current user
  const users = await prisma.user.findMany({
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

  return (
    <ChatContent 
      users={users}
      currentUserId={userId}
      currentUserName={session.user.name || session.user.email || 'User'}
      openUserId={searchParams.userId}
    />
  );
}
