
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/settings/task-priorities/[id] - Editar prioridade customizada
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Apenas ADMIN e MANAGER podem editar prioridades customizadas
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { name, level, color, icon, isDefault } = body;

    // Verificar se a prioridade existe e pertence à empresa
    const priority = await prisma.customTaskPriority.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!priority) {
      return NextResponse.json({ error: 'Prioridade não encontrada' }, { status: 404 });
    }

    // Se o nome foi alterado, verificar se não existe outra prioridade com o novo nome
    if (name && name !== priority.name) {
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
    }

    // Se o nível foi alterado, verificar se não existe outra prioridade com o novo nível
    if (level !== undefined && level !== priority.level) {
      // Validar level (1-5)
      if (level < 1 || level > 5) {
        return NextResponse.json(
          { error: 'Nível deve estar entre 1 e 5' },
          { status: 400 }
        );
      }

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
    }

    // Se isDefault = true, remover o default de outras prioridades
    if (isDefault && !priority.isDefault) {
      await prisma.customTaskPriority.updateMany({
        where: { companyId: user.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedPriority = await prisma.customTaskPriority.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(level !== undefined && { level }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json(updatedPriority);
  } catch (error) {
    console.error('Error updating task priority:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar prioridade' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/task-priorities/[id] - Deletar prioridade customizada
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Apenas ADMIN e MANAGER podem deletar prioridades customizadas
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se a prioridade existe e pertence à empresa
    const priority = await prisma.customTaskPriority.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!priority) {
      return NextResponse.json({ error: 'Prioridade não encontrada' }, { status: 404 });
    }

    // Verificar se há tarefas usando esta prioridade
    if (priority._count.tasks > 0) {
      return NextResponse.json(
        { error: `Não é possível deletar. Existem ${priority._count.tasks} tarefa(s) usando esta prioridade.` },
        { status: 400 }
      );
    }

    await prisma.customTaskPriority.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Prioridade deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting task priority:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar prioridade' },
      { status: 500 }
    );
  }
}
