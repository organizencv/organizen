import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const template = await prisma.messageTemplate.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, subject, content, category, isPublic } = await request.json();

    // Verificar se o template existe e pertence ao usuário ou empresa
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Apenas o criador ou admin/manager pode editar
    const canEdit = 
      existingTemplate.userId === session.user.id ||
      ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Se tornar público, verificar permissões
    if (isPublic && !['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only managers can create public templates' },
        { status: 403 }
      );
    }

    const template = await prisma.messageTemplate.update({
      where: { id: params.id },
      data: {
        name,
        subject,
        content,
        category,
        isPublic,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar se o template existe
    const template = await prisma.messageTemplate.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Apenas o criador ou admin/manager pode eliminar
    const canDelete = 
      template.userId === session.user.id ||
      ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role);

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    await prisma.messageTemplate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
