
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// GET - Buscar departamentos do usuário
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = params.id

    // Buscar departamentos do usuário
    const userDepartments = await prisma.userDepartment.findMany({
      where: { userId },
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
      orderBy: [
        { isPrimary: 'desc' }, // Primário primeiro
        { priority: 'desc' },   // Por prioridade
        { createdAt: 'asc' },   // Mais antigos primeiro
      ],
    })

    return NextResponse.json(userDepartments)
  } catch (error) {
    console.error('Erro ao buscar departamentos do usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar departamentos do usuário' },
      { status: 500 }
    )
  }
}

// POST - Adicionar departamento ao usuário
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissões (apenas ADMIN e MANAGER podem adicionar)
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const userId = params.id
    const body = await req.json()
    const { departmentId, role, teamId, availability, priority, isPrimary } = body

    // Verificar se já existe
    const existingAssignment = await prisma.userDepartment.findUnique({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Usuário já está atribuído a este departamento' },
        { status: 400 }
      )
    }

    // Se isPrimary = true, desmarcar outros como primário
    if (isPrimary) {
      await prisma.userDepartment.updateMany({
        where: { userId },
        data: { isPrimary: false },
      })
    }

    // Criar nova atribuição
    const newAssignment = await prisma.userDepartment.create({
      data: {
        userId,
        departmentId,
        role: role || null,
        teamId: teamId || null,
        availability: availability || 100,
        priority: priority || 0,
        isPrimary: isPrimary || false,
        isActive: true,
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

    // Se for o primeiro departamento, também atualizar User.departmentId (compatibilidade)
    const userDepartmentsCount = await prisma.userDepartment.count({
      where: { userId },
    })

    if (userDepartmentsCount === 1 || isPrimary) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          departmentId,
          teamId: teamId || null,
        },
      })
    }

    return NextResponse.json(newAssignment, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar departamento ao usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar departamento ao usuário' },
      { status: 500 }
    )
  }
}
