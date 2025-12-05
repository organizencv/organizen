import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Listar templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {
      companyId: session.user.companyId,
      OR: [
        { isPublic: true },
        { userId: session.user.id }
      ]
    };

    if (category) {
      where.category = category;
    }

    const templates = await prisma.messageTemplate.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates);

  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Criar template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, subject, content, category, isPublic } = await request.json();

    // Verificar permissões para template público
    const canCreatePublic = ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role);
    
    if (isPublic && !canCreatePublic) {
      return NextResponse.json(
        { error: 'Sem permissão para criar templates públicos' },
        { status: 403 }
      );
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name,
        subject,
        content,
        category: category || null,
        isPublic: isPublic && canCreatePublic,
        userId: session.user.id,
        companyId: session.user.companyId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(template);

  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
