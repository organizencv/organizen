
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/testimonials - Listar todos os testemunhos (apenas ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas ADMIN pode listar todos os testemunhos
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão. Apenas administradores podem gerir testemunhos.' },
        { status: 403 }
      );
    }

    const testimonials = await prisma.testimonial.findMany({
      where: {
        companyId: session.user.companyId,
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
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error('Erro ao buscar testemunhos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar testemunhos' },
      { status: 500 }
    );
  }
}

// POST /api/testimonials - Criar novo testemunho (apenas ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas ADMIN pode criar testemunhos
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão. Apenas administradores podem criar testemunhos.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, jobTitle, company, comment, rating, isActive, order, userId } = body;

    // Validações
    if (!name || !jobTitle || !company || !comment) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, jobTitle, company, comment' },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating deve estar entre 1 e 5' },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        companyId: session.user.companyId,
        userId: userId || session.user.id, // Usa o userId fornecido ou o do utilizador logado
        name,
        jobTitle,
        company,
        comment,
        rating: rating || 5,
        isActive: isActive !== undefined ? isActive : true,
        order: order || null,
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

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar testemunho:', error);
    return NextResponse.json(
      { error: 'Erro ao criar testemunho' },
      { status: 500 }
    );
  }
}
