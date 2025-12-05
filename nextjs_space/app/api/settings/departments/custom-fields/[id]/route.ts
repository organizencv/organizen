
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/settings/departments/custom-fields/:id - Editar campo customizado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas ADMIN pode editar campos customizados
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const id = params.id;
    const body = await request.json();
    const { fieldName, fieldType, fieldOptions, isRequired, order } = body;

    const companyId = session.user.companyId;

    // Verificar se o campo existe e pertence à empresa
    const existing = await prisma.departmentCustomField.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Campo não encontrado' },
        { status: 404 }
      );
    }

    // Se mudou o nome, verificar se não entra em conflito
    if (fieldName && fieldName !== existing.fieldName) {
      const conflict = await prisma.departmentCustomField.findUnique({
        where: {
          companyId_fieldName: {
            companyId,
            fieldName
          }
        }
      });

      if (conflict) {
        return NextResponse.json(
          { error: 'Já existe um campo com esse nome' },
          { status: 400 }
        );
      }
    }

    const customField = await prisma.departmentCustomField.update({
      where: { id },
      data: {
        fieldName,
        fieldType,
        fieldOptions,
        isRequired,
        order
      }
    });

    return NextResponse.json(customField);
  } catch (error) {
    console.error('Error updating department custom field:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar campo customizado' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/departments/custom-fields/:id - Deletar campo customizado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas ADMIN pode deletar campos customizados
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const id = params.id;
    const companyId = session.user.companyId;

    // Verificar se o campo existe e pertence à empresa
    const existing = await prisma.departmentCustomField.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Campo não encontrado' },
        { status: 404 }
      );
    }

    await prisma.departmentCustomField.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting department custom field:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar campo customizado' },
      { status: 500 }
    );
  }
}
