
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/settings/task-statuses/[id] - Editar status customizado
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

    // Apenas ADMIN e MANAGER podem editar status customizados
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { name, color, icon, isDefault, isArchived } = body;

    // Verificar se o status existe e pertence à empresa
    const status = await prisma.customTaskStatus.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!status) {
      return NextResponse.json({ error: 'Status não encontrado' }, { status: 404 });
    }

    // Se o nome foi alterado, verificar se não existe outro status com o novo nome
    if (name && name !== status.name) {
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
    }

    // Se isDefault = true, remover o default de outros status
    if (isDefault && !status.isDefault) {
      await prisma.customTaskStatus.updateMany({
        where: { companyId: user.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedStatus = await prisma.customTaskStatus.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });

    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/task-statuses/[id] - Deletar status customizado
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

    // Apenas ADMIN e MANAGER podem deletar status customizados
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se o status existe e pertence à empresa
    const status = await prisma.customTaskStatus.findFirst({
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

    if (!status) {
      return NextResponse.json({ error: 'Status não encontrado' }, { status: 404 });
    }

    // Verificar se há tarefas usando este status
    if (status._count.tasks > 0) {
      return NextResponse.json(
        { error: `Não é possível deletar. Existem ${status._count.tasks} tarefa(s) usando este status.` },
        { status: 400 }
      );
    }

    await prisma.customTaskStatus.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Status deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting task status:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar status' },
      { status: 500 }
    );
  }
}
