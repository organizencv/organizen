
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/settings/task-priorities - Listar prioridades customizadas
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

    const priorities = await prisma.customTaskPriority.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: { level: 'asc' },
    });

    return NextResponse.json(priorities);
  } catch (error) {
    console.error('Error fetching task priorities:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar prioridades' },
      { status: 500 }
    );
  }
}

// POST /api/settings/task-priorities - Criar prioridade customizada
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

    // Apenas ADMIN e MANAGER podem criar prioridades customizadas
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { name, level, color, icon, isDefault } = body;

    if (!name || !color || level === undefined) {
      return NextResponse.json(
        { error: 'Nome, cor e nível são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar level (1-5)
    if (level < 1 || level > 5) {
      return NextResponse.json(
        { error: 'Nível deve estar entre 1 e 5' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma prioridade com esse nome
    const existingName = await prisma.customTaskPriority.findUnique({
      where: {
        companyId_name: {
          companyId: user.companyId,
          name,
        },
      },
    });

    if (existingName) {
      return NextResponse.json(
        { error: 'Já existe uma prioridade com esse nome' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma prioridade com esse nível
    const existingLevel = await prisma.customTaskPriority.findUnique({
      where: {
        companyId_level: {
          companyId: user.companyId,
          level,
        },
      },
    });

    if (existingLevel) {
      return NextResponse.json(
        { error: 'Já existe uma prioridade com esse nível' },
        { status: 400 }
      );
    }

    // Se isDefault = true, remover o default de outras prioridades
    if (isDefault) {
      await prisma.customTaskPriority.updateMany({
        where: { companyId: user.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newPriority = await prisma.customTaskPriority.create({
      data: {
        companyId: user.companyId,
        name,
        level,
        color,
        icon: icon || null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(newPriority, { status: 201 });
  } catch (error) {
    console.error('Error creating task priority:', error);
    return NextResponse.json(
      { error: 'Erro ao criar prioridade' },
      { status: 500 }
    );
  }
}
