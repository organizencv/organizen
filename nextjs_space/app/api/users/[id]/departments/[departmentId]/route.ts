
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// PUT - Atualizar atribuição de departamento
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; departmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissões
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id: userId, departmentId } = params
    const body = await req.json()
    const { role, teamId, availability, priority, isPrimary, isActive } = body

    // Se isPrimary = true, desmarcar outros como primário
    if (isPrimary) {
      await prisma.userDepartment.updateMany({
        where: { 
          userId,
          NOT: { departmentId }
        },
        data: { isPrimary: false },
      })
    }

    // Atualizar atribuição
    const updatedAssignment = await prisma.userDepartment.update({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
      data: {
        role: role !== undefined ? role : undefined,
        teamId: teamId !== undefined ? teamId : undefined,
        availability: availability !== undefined ? availability : undefined,
        priority: priority !== undefined ? priority : undefined,
        isPrimary: isPrimary !== undefined ? isPrimary : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date(),
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Se marcou como primário, atualizar User.departmentId (compatibilidade)
    if (isPrimary) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          departmentId,
          teamId: teamId || null,
        },
      })
    }

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error('Erro ao atualizar atribuição de departamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar atribuição de departamento' },
      { status: 500 }
    )
  }
}

// DELETE - Remover departamento do usuário
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; departmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissões
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id: userId, departmentId } = params

    // Verificar se é o último departamento
    const userDepartmentsCount = await prisma.userDepartment.count({
      where: { userId, isActive: true },
    })

    if (userDepartmentsCount === 1) {
      return NextResponse.json(
        { error: 'Não é possível remover o último departamento ativo do usuário' },
        { status: 400 }
      )
    }

    // Buscar a atribuição antes de deletar
    const assignment = await prisma.userDepartment.findUnique({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    })

    // Deletar atribuição
    await prisma.userDepartment.delete({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    })

    // Se era o departamento primário, definir outro como primário
    if (assignment?.isPrimary) {
      const newPrimaryDept = await prisma.userDepartment.findFirst({
        where: { userId, isActive: true },
        orderBy: { priority: 'desc' },
      })

      if (newPrimaryDept) {
        await prisma.userDepartment.update({
          where: { id: newPrimaryDept.id },
          data: { isPrimary: true },
        })

        // Atualizar User.departmentId (compatibilidade)
        await prisma.user.update({
          where: { id: userId },
          data: {
            departmentId: newPrimaryDept.departmentId,
            teamId: newPrimaryDept.teamId,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover departamento do usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao remover departamento do usuário' },
      { status: 500 }
    )
  }
}
