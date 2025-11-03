
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TasksContent } from '@/components/tasks-content';

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams
}: {
  searchParams: { taskId?: string }
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const companyId = session.user.companyId;
  const userRole = session.user.role;
  const userId = session.user.id;

  // Fetch tasks based on user role
  let tasksQuery: any = {
    where: { companyId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' }
    ]
  };

  // Staff can only see their own tasks
  if (userRole === 'STAFF') {
    tasksQuery.where.userId = userId;
  }

  const [tasks, users] = await Promise.all([
    prisma.task.findMany(tasksQuery),
    // Only fetch users for non-staff roles
    userRole !== 'STAFF' ? prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    }) : []
  ]);

  // Convert dates to strings for client components
  const serializedTasks = tasks.map((task: any) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate?.toISOString() || null,
    status: task.status,
    user: (task as any).user,
  }));

  return (
    <TasksContent 
      tasks={serializedTasks} 
      users={users}
      userRole={userRole}
      currentUserId={userId}
      openTaskId={searchParams.taskId}
    />
  );
}
