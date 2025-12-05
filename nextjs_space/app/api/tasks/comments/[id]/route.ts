import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/tasks/comments/[id]
 * Eliminar comentário (apenas autor ou admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar comentário
    const comment = await prisma.taskComment.findUnique({
      where: { id: params.id },
      include: {
        task: {
          select: { companyId: true }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      );
    }

    // Validar que o usuário pertence à mesma empresa
    if (comment.task.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Verificar se o usuário é o autor OU é admin
    const isAuthor = comment.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Apenas o autor ou administrador pode eliminar este comentário' },
        { status: 403 }
      );
    }

    // Eliminar comentário
    await prisma.taskComment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Comentário eliminado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao eliminar comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao eliminar comentário' },
      { status: 500 }
    );
  }
}
