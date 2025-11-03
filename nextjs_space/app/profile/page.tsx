
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProfileContent } from '@/components/profile-content';

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Fetch complete user information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: true,
      department: true,
      team: {
        include: {
          department: true
        }
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  // Convert dates to strings for client components
  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    hireDate: user.hireDate ? user.hireDate.toISOString() : null,
  };

  return (
    <ProfileContent user={serializedUser} />
  );
}
