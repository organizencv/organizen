
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Buscar todos os departamentos de um usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Buscar departamentos do usuário
    const userDepartments = await prisma.userDepartment.findMany({
      where: {
        userId,
        user: {
          companyId: session.user.companyId
        }
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' }, // Primário primeiro
        { priority: 'desc' },  // Depois por prioridade
        { createdAt: 'asc' }   // Depois por data de criação
      ]
    });

    return NextResponse.json(userDepartments);
  } catch (error) {
    console.error('[User Departments GET] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar departamentos' },
      { status: 500 }
    );
  }
}

/**
 * POST - Adicionar departamento ao usuário
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas ADMIN e MANAGER podem adicionar departamentos
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { departmentId, isPrimary, isActive, priority, role, availability } = body;

    // Validar que o usuário existe e pertence à mesma empresa
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: session.user.companyId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Validar que o departamento existe e pertence à mesma empresa
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId: session.user.companyId
      }
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Departamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe esta associação
    const existing = await prisma.userDepartment.findUnique({
      where: {
        userId_departmentId: {
          userId,
          departmentId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Usuário já está neste departamento' },
        { status: 400 }
      );
    }

    // Se estamos marcando como primário, desmarcar os outros
    if (isPrimary) {
      await prisma.userDepartment.updateMany({
        where: {
          userId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });

      // Atualizar o departmentId principal do usuário
      await prisma.user.update({
        where: { id: userId },
        data: { departmentId }
      });
    }

    // Criar a associação
    const userDepartment = await prisma.userDepartment.create({
      data: {
        userId,
        departmentId,
        isPrimary: isPrimary ?? false,
        isActive: isActive ?? true,
        priority: priority ?? 0,
        role: role || null,
        availability: availability || null
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(userDepartment, { status: 201 });
  } catch (error) {
    console.error('[User Departments POST] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar departamento' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar configurações de um departamento do usuário
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas ADMIN e MANAGER podem atualizar
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { userDepartmentId, departmentId, isPrimary, isActive, priority, role, availability } = body;

    let whereClause;

    if (userDepartmentId) {
      // Atualizar por ID direto
      whereClause = { id: userDepartmentId };
    } else if (departmentId) {
      // Atualizar pela combinação userId + departmentId
      whereClause = {
        userId_departmentId: {
          userId,
          departmentId
        }
      };
    } else {
      return NextResponse.json(
        { error: 'userDepartmentId ou departmentId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar que existe
    const existing = await prisma.userDepartment.findUnique({
      where: whereClause,
      include: {
        user: true
      }
    });

    if (!existing || existing.user.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Associação não encontrada' },
        { status: 404 }
      );
    }

    // Se estamos marcando como primário, desmarcar os outros
    if (isPrimary && !existing.isPrimary) {
      await prisma.userDepartment.updateMany({
        where: {
          userId,
          isPrimary: true,
          id: { not: existing.id }
        },
        data: {
          isPrimary: false
        }
      });

      // Atualizar o departmentId principal do usuário
      await prisma.user.update({
        where: { id: userId },
        data: { departmentId: existing.departmentId }
      });
    }

    // Atualizar a associação
    const updated = await prisma.userDepartment.update({
      where: whereClause,
      data: {
        isPrimary: isPrimary ?? existing.isPrimary,
        isActive: isActive ?? existing.isActive,
        priority: priority ?? existing.priority,
        role: role !== undefined ? role : existing.role,
        availability: availability !== undefined ? availability : existing.availability,
        updatedAt: new Date()
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[User Departments PUT] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar departamento' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remover departamento do usuário
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas ADMIN e MANAGER podem remover
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const userDepartmentId = searchParams.get('userDepartmentId');
    const departmentId = searchParams.get('departmentId');

    if (!userDepartmentId && !departmentId) {
      return NextResponse.json(
        { error: 'userDepartmentId ou departmentId é obrigatório' },
        { status: 400 }
      );
    }

    let whereClause;

    if (userDepartmentId) {
      whereClause = { id: userDepartmentId };
    } else {
      whereClause = {
        userId_departmentId: {
          userId,
          departmentId: departmentId!
        }
      };
    }

    // Verificar que existe
    const existing = await prisma.userDepartment.findUnique({
      where: whereClause,
      include: {
        user: true
      }
    });

    if (!existing || existing.user.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Associação não encontrada' },
        { status: 404 }
      );
    }

    // Não permitir remover se for o último departamento ativo
    const activeCount = await prisma.userDepartment.count({
      where: {
        userId,
        isActive: true
      }
    });

    if (activeCount === 1 && existing.isActive) {
      return NextResponse.json(
        { error: 'Não é possível remover o último departamento ativo' },
        { status: 400 }
      );
    }

    // Se era o primário, precisamos escolher outro
    if (existing.isPrimary) {
      // Buscar o próximo com maior prioridade
      const next = await prisma.userDepartment.findFirst({
        where: {
          userId,
          id: { not: existing.id },
          isActive: true
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      });

      if (next) {
        await prisma.userDepartment.update({
          where: { id: next.id },
          data: { isPrimary: true }
        });

        await prisma.user.update({
          where: { id: userId },
          data: { departmentId: next.departmentId }
        });
      } else {
        // Nenhum outro departamento, colocar null
        await prisma.user.update({
          where: { id: userId },
          data: { departmentId: null }
        });
      }
    }

    // Deletar a associação
    await prisma.userDepartment.delete({
      where: whereClause
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[User Departments DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover departamento' },
      { status: 500 }
    );
  }
}
