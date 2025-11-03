
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DepartmentsContent } from '@/components/departments-content';

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/dashboard');
  }

  const companyId = session.user.companyId;

  // Fetch departments with counts
  const departments = await prisma.department.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { users: true, teams: true }
      },
      template: {
        include: {
          customFields: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Fetch available templates
  const templates = await prisma.departmentTemplate.findMany({
    where: { companyId },
    include: {
      customFields: {
        orderBy: { displayOrder: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <DepartmentsContent 
      departments={departments} 
      userRole={session.user.role}
      templates={templates}
    />
  );
}
