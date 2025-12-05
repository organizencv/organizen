
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET single department
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const department = await prisma.department.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        teams: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        template: {
          include: {
            customFields: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        },
        _count: {
          select: { users: true, teams: true }
        }
      }
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ error: 'Failed to fetch department' }, { status: 500 });
  }
}

// PUT update department
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, templateId, customFields } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updateData: any = { name };
    
    if (templateId !== undefined) {
      updateData.templateId = templateId || null;
    }
    
    if (customFields !== undefined) {
      updateData.customFieldsData = customFields;
    }

    const department = await prisma.department.updateMany({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      data: updateData
    });

    if (department.count === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const updatedDepartment = await prisma.department.findUnique({
      where: { id: params.id },
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
      }
    });

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

// DELETE department
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if department has users
    const department = await prisma.department.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (department._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with assigned users' },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
