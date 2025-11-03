
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';



export const dynamic = 'force-dynamic';

// GET /api/testimonials/active - Buscar testemunhos ativos para exibir na página de login
// Esta rota é PÚBLICA (não requer autenticação)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const companyId = searchParams.get('companyId');

    // Se não houver companyId, buscar testemunhos de todas as empresas
    // (útil para página de login global ou demo)
    const where: any = {
      isActive: true,
    };

    if (companyId) {
      where.companyId = companyId;
    }

    // Buscar testemunhos ativos
    let testimonials = await prisma.testimonial.findMany({
      where,
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
      take: limit * 2, // Buscar mais para depois randomizar
    });

    // Se houver ordem manual definida, usar essa ordem
    // Senão, fazer rotação aleatória
    const hasManualOrder = testimonials.some((t: any) => t.order !== null);
    
    if (!hasManualOrder && testimonials.length > limit) {
      // Embaralhar aleatoriamente
      testimonials = testimonials
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
    } else {
      // Usar ordem manual ou limitar ao número solicitado
      testimonials = testimonials.slice(0, limit);
    }

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error('Erro ao buscar testemunhos ativos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar testemunhos ativos' },
      { status: 500 }
    );
  }
}
