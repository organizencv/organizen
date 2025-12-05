
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/settings/departments/templates/:id - Editar template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas ADMIN pode editar templates
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const id = params.id;
    const body = await request.json();
    const { name, description, defaultManagerRole, fieldIds } = body;

    const companyId = session.user.companyId;

    // Verificar se o template existe e pertence à empresa
    const existing = await prisma.departmentTemplate.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Se mudou o nome, verificar se não entra em conflito
    if (name && name !== existing.name) {
      const conflict = await prisma.departmentTemplate.findUnique({
        where: {
          companyId_name: {
            companyId,
            name
          }
        }
      });

      if (conflict) {
        return NextResponse.json(
          { error: 'Já existe um template com esse nome' },
          { status: 400 }
        );
      }
    }

    // Atualizar o template
    const template = await prisma.departmentTemplate.update({
      where: { id },
      data: {
        name,
        description,
        defaultManagerRole
      }
    });

    // Atualizar campos associados
    if (fieldIds !== undefined && Array.isArray(fieldIds)) {
      // Deletar campos antigos
      await prisma.templateCustomField.deleteMany({
        where: { templateId: id }
      });

      // Criar novos campos se houver
      if (fieldIds.length > 0) {
        const fields = await prisma.departmentCustomField.findMany({
          where: {
            id: { in: fieldIds },
            companyId
          }
        });

        await prisma.templateCustomField.createMany({
          data: fields.map((field: any, index: number) => ({
            templateId: template.id,
            name: field.fieldName,
            fieldType: field.fieldType,
            options: field.fieldOptions ? JSON.stringify(field.fieldOptions) : null,
            isRequired: field.isRequired,
            displayOrder: index
          }))
        });
      }
    }

    // Buscar o template completo com os campos associados
    const templateWithFields = await prisma.departmentTemplate.findUnique({
      where: { id: template.id },
      include: {
        customFields: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { departments: true }
        }
      }
    });

    return NextResponse.json(templateWithFields);
  } catch (error) {
    console.error('Error updating department template:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar template' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/departments/templates/:id - Deletar template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas ADMIN pode deletar templates
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const id = params.id;
    const companyId = session.user.companyId;

    // Verificar se o template existe e pertence à empresa
    const existing = await prisma.departmentTemplate.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        _count: {
          select: { departments: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há departamentos usando este template
    if (existing._count.departments > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar um template em uso' },
        { status: 400 }
      );
    }

    await prisma.departmentTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting department template:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar template' },
      { status: 500 }
    );
  }
}
