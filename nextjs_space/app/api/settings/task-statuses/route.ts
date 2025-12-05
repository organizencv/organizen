
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/settings/task-statuses - Listar status customizados
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const statuses = await prisma.customTaskStatus.findMany({
      where: {
        companyId: user.companyId,
        isArchived: false,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    );
  }
}

// POST /api/settings/task-statuses - Criar status customizado
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Apenas ADMIN e MANAGER podem criar status customizados
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { name, color, icon, isDefault } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Nome e cor são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe um status com esse nome
    const existing = await prisma.customTaskStatus.findUnique({
      where: {
        companyId_name: {
          companyId: user.companyId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um status com esse nome' },
        { status: 400 }
      );
    }

    // Se isDefault = true, remover o default de outros status
    if (isDefault) {
      await prisma.customTaskStatus.updateMany({
        where: { companyId: user.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Buscar o maior order atual
    const maxOrder = await prisma.customTaskStatus.findFirst({
      where: { companyId: user.companyId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newStatus = await prisma.customTaskStatus.create({
      data: {
        companyId: user.companyId,
        name,
        color,
        icon: icon || null,
        isDefault: isDefault || false,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    console.error('Error creating task status:', error);
    return NextResponse.json(
      { error: 'Erro ao criar status' },
      { status: 500 }
    );
  }
}
