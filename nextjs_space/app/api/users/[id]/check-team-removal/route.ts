
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { role, departmentId } = await request.json();

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        team: {
          include: {
            leader: true,
            department: true,
          }
        },
        ledTeams: true,
      }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const affectedTeams: string[] = [];
    let willBeRemoved = false;

    // Check if department or role is changing
    const isDepartmentChanging = currentUser.departmentId !== (departmentId || null);
    const isRoleChanging = currentUser.role !== role;
    
    // Check if user will be removed from current team (as member)
    if ((isDepartmentChanging || isRoleChanging) && currentUser.teamId && currentUser.team) {
      const currentTeam = currentUser.team;
      
      // Check if department is actually changing (not just null vs no-department)
      const currentDeptId = currentUser.departmentId || null;
      const newDeptId = departmentId || null;
      const isDifferentDepartment = currentDeptId !== newDeptId;
      
      // Check role compatibility - if user is a member (not leader)
      const isLeader = currentTeam.leaderId === currentUser.id;
      const isRoleIncompatible = !isLeader && currentTeam.leader && 
        (
          (currentTeam.leader.role === 'SUPERVISOR' && role !== 'STAFF') ||
          (currentTeam.leader.role === 'MANAGER' && !['STAFF', 'SUPERVISOR'].includes(role)) ||
          (currentTeam.leader.role === 'ADMIN' && !['STAFF', 'SUPERVISOR', 'MANAGER'].includes(role))
        );

      if (isDifferentDepartment || isRoleIncompatible) {
        willBeRemoved = true;
        affectedTeams.push(`${currentTeam.name} (como membro)`);
      }
    }

    // Check if user will be removed as leader
    if (isRoleChanging && currentUser.ledTeams && currentUser.ledTeams.length > 0) {
      // Leaders must remain in leadership roles (ADMIN, MANAGER, SUPERVISOR)
      // If changing to a non-leadership role OR changing between leadership roles, remove as leader
      const currentRole = currentUser.role;
      const newRole = role;
      
      // Remove as leader if:
      // 1. Demoted to STAFF
      // 2. Or changing between leadership levels (e.g., SUPERVISOR → MANAGER)
      if (!['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(newRole) || currentRole !== newRole) {
        willBeRemoved = true;
        currentUser.ledTeams.forEach((t: any) => {
          affectedTeams.push(`${t.name} (como líder)`);
        });
      }
    }

    return NextResponse.json({
      willBeRemoved,
      affectedTeams: [...new Set(affectedTeams)], // Remove duplicates
      reason: isDepartmentChanging ? 'department' : 'role',
    });

  } catch (error) {
    console.error('Check team removal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
