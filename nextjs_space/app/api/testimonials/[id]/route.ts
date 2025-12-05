
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/testimonials/[id] - Atualizar testemunho (apenas ADMIN)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas ADMIN pode atualizar testemunhos
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão. Apenas administradores podem atualizar testemunhos.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, jobTitle, company, comment, rating, isActive, order, userId } = body;

    // Verificar se o testemunho existe e pertence à empresa do usuário
    const existingTestimonial = await prisma.testimonial.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: 'Testemunho não encontrado' },
        { status: 404 }
      );
    }

    // Validação de rating
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating deve estar entre 1 e 5' },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(jobTitle && { jobTitle }),
        ...(company && { company }),
        ...(comment && { comment }),
        ...(rating !== undefined && { rating }),
        ...(userId !== undefined && { userId }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('Erro ao atualizar testemunho:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar testemunho' },
      { status: 500 }
    );
  }
}

// DELETE /api/testimonials/[id] - Excluir testemunho (apenas ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas ADMIN pode excluir testemunhos
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão. Apenas administradores podem excluir testemunhos.' },
        { status: 403 }
      );
    }

    // Verificar se o testemunho existe e pertence à empresa do usuário
    const existingTestimonial = await prisma.testimonial.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: 'Testemunho não encontrado' },
        { status: 404 }
      );
    }

    await prisma.testimonial.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir testemunho:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir testemunho' },
      { status: 500 }
    );
  }
}
