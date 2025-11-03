
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/settings/task-tags/[id] - Editar tag customizada
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

    // Apenas ADMIN e MANAGER podem editar tags customizadas
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { name, color, description } = body;

    // Verificar se a tag existe e pertence à empresa
    const tag = await prisma.customTaskTag.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }

    // Se o nome foi alterado, verificar se não existe outra tag com o novo nome
    if (name && name !== tag.name) {
      const existing = await prisma.customTaskTag.findUnique({
        where: {
          companyId_name: {
            companyId: user.companyId,
            name,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Já existe uma tag com esse nome' },
          { status: 400 }
        );
      }
    }

    const updatedTag = await prisma.customTaskTag.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('Error updating task tag:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tag' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/task-tags/[id] - Deletar tag customizada
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

    // Apenas ADMIN e MANAGER podem deletar tags customizadas
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se a tag existe e pertence à empresa
    const tag = await prisma.customTaskTag.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }

    await prisma.customTaskTag.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Tag deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting task tag:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar tag' },
      { status: 500 }
    );
  }
}
