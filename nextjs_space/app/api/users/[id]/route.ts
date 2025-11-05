
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can view their own profile, or admins/managers can view any profile
    const canView = 
      session.user.id === params.id ||
      ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role);

    if (!canView) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        ledTeams: {
          select: {
            id: true,
            name: true,
          }
        },
        assignedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        },
        assignedShifts: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 50
        },
        timeOffRequests: {
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            status: true,
            reason: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        },
        shiftSwapRequests: {
          select: {
            id: true,
            status: true,
            originalShiftId: true,
            offeredShiftId: true,
            createdAt: true,
            targetUser: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedUser = {
      id: user.id,
      name: user.name || '',
      email: user.email,
      role: user.role,
      image: user.image || undefined,
      language: user.language || 'pt',
      departmentId: user.departmentId,
      teamId: user.teamId,
      createdAt: user.createdAt.toISOString(),
      department: user.department,
      team: user.team,
      ledTeams: user.ledTeams || [],
      ledTeamsCount: user.ledTeams?.length || 0,
      assignedTasksCount: user.assignedTasks.length,
      shiftsCount: user.assignedShifts.length,
      // Dados Pessoais
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postalCode,
      birthDate: user.birthDate?.toISOString(),
      taxId: user.taxId,
      // Dados Profissionais
      employeeNumber: user.employeeNumber,
      hireDate: user.hireDate?.toISOString(),
      jobTitle: user.jobTitle,
      // Contacto de Emergência
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
      emergencyContactRelation: user.emergencyContactRelation,
      // Statistics
      tasks: user.assignedTasks,
      shifts: user.assignedShifts.map((shift: any) => ({
        id: shift.id,
        date: shift.startTime.toISOString().split('T')[0],
        startTime: shift.startTime.toISOString().split('T')[1].slice(0, 5),
        endTime: shift.endTime.toISOString().split('T')[1].slice(0, 5),
        type: shift.title
      })),
      timeOffRequests: user.timeOffRequests,
      shiftSwapRequests: user.shiftSwapRequests.map((swap: any) => ({
        id: swap.id,
        status: swap.status,
        requestedDate: swap.createdAt.toISOString(),
        offeredDate: swap.offeredShiftId || '',
        targetUser: swap.targetUser || { id: '', name: 'N/A' }
      }))
    };

    return NextResponse.json(formattedUser);

  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { name, email, role, departmentId, teamId, birthDate } = await request.json();

    // Get current user data to check if department or role is changing
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        team: {
          include: {
            leader: true,
            department: true,
          }
        },
        ledTeams: true, // Equipas que o utilizador lidera
      }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if department or role is changing
    const currentDeptId = currentUser.departmentId || null;
    const newDeptId = departmentId || null;
    const isDepartmentChanging = currentDeptId !== newDeptId;
    const isRoleChanging = currentUser.role !== role;
    
    let shouldRemoveFromTeam = false;
    let removedFromTeams: string[] = [];
    let teamsWithoutLeader: Array<{id: string, name: string, departmentId: string | null}> = [];

    // If department or role is changing, check team compatibility (as member)
    if ((isDepartmentChanging || isRoleChanging) && currentUser.teamId && currentUser.team) {
      const currentTeam = currentUser.team;
      const isLeader = currentTeam.leaderId === currentUser.id;
      
      // Check if department is actually different
      const isDifferentDepartment = currentDeptId !== newDeptId;
      
      // Check if the new role would be incompatible with being in this team
      // (only applies if user is a member, not the leader)
      const isRoleIncompatible = !isLeader && currentTeam.leader && 
        (
          (currentTeam.leader.role === 'SUPERVISOR' && role !== 'STAFF') ||
          (currentTeam.leader.role === 'MANAGER' && !['STAFF', 'SUPERVISOR'].includes(role)) ||
          (currentTeam.leader.role === 'ADMIN' && !['STAFF', 'SUPERVISOR', 'MANAGER'].includes(role))
        );

      if (isDifferentDepartment || isRoleIncompatible) {
        shouldRemoveFromTeam = true;
        removedFromTeams.push(`${currentTeam.name} (como membro)`);
      }
    }

    // If user is leading teams and role is changing, remove as leader
    if (isRoleChanging && currentUser.ledTeams && currentUser.ledTeams.length > 0) {
      const currentRole = currentUser.role;
      const newRole = role;
      
      // Remove as leader if:
      // 1. Demoted to non-leadership role (STAFF)
      // 2. Or changing between leadership levels (e.g., SUPERVISOR → MANAGER, MANAGER → ADMIN)
      if (!['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(newRole) || currentRole !== newRole) {
        // Remove as leader from all teams
        for (const team of currentUser.ledTeams) {
          await prisma.team.update({
            where: { id: team.id },
            data: { leaderId: null }
          });
          
          removedFromTeams.push(`${team.name} (como líder)`);
          teamsWithoutLeader.push({
            id: team.id,
            name: team.name,
            departmentId: team.departmentId
          });
        }
      }
    }

    // Create notifications for teams without leader
    if (teamsWithoutLeader.length > 0) {
      for (const team of teamsWithoutLeader) {
        // Find the superior (team leader's department head or admin)
        let superiorId: string | null = null;
        
        if (team.departmentId) {
          // Find department head (manager of this department)
          const departmentHead = await prisma.user.findFirst({
            where: {
              departmentId: team.departmentId,
              role: 'MANAGER',
              companyId: session.user.companyId,
            }
          });
          superiorId = departmentHead?.id || null;
        }
        
        // If no department head, notify all admins
        if (!superiorId) {
          const admins = await prisma.user.findMany({
            where: {
              role: 'ADMIN',
              companyId: session.user.companyId,
            },
            select: { id: true }
          });
          
          // Create notification for each admin
          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                title: 'Equipa sem líder',
                message: `A equipa "${team.name}" ficou sem líder. Por favor, designe um novo líder.`,
                type: 'SYSTEM',
                relatedId: team.id,
              }
            });
          }
        } else {
          // Create notification for superior
          await prisma.notification.create({
            data: {
              userId: superiorId,
              title: 'Equipa sem líder',
              message: `A equipa "${team.name}" ficou sem líder. Por favor, designe um novo líder.`,
              type: 'SYSTEM',
              relatedId: team.id,
            }
          });
        }
      }
    }

    // Update user data
    const updateData: any = {
      name,
      email,
      role,
      departmentId: departmentId || null,
      teamId: shouldRemoveFromTeam ? null : (teamId || null),
      birthDate: birthDate ? new Date(birthDate) : null,
    };

    const user = await prisma.user.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: updateData,
      include: {
        department: true,
        team: true,
      }
    });

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/users');
    revalidatePath('/teams');

    return NextResponse.json({
      ...user,
      removedFromTeams: removedFromTeams.length > 0 ? removedFromTeams : undefined,
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Don't allow deleting self
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      }
    });

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/users');

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
