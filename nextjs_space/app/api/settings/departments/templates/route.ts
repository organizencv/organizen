
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/settings/departments/templates - Listar templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const templates = await prisma.departmentTemplate.findMany({
      where: { companyId },
      include: {
        customFields: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { departments: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching department templates:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar templates' },
      { status: 500 }
    );
  }
}

// POST /api/settings/departments/templates - Criar template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas ADMIN pode criar templates
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, defaultManagerRole, fieldIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;

    // Verificar se já existe um template com esse nome
    const existing = await prisma.departmentTemplate.findUnique({
      where: {
        companyId_name: {
          companyId,
          name
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um template com esse nome' },
        { status: 400 }
      );
    }

    // Criar o template
    const template = await prisma.departmentTemplate.create({
      data: {
        companyId,
        name,
        description,
        defaultManagerRole
      }
    });

    // Se há campos selecionados, associar ao template
    if (fieldIds && Array.isArray(fieldIds) && fieldIds.length > 0) {
      // Buscar os campos para copiar suas informações
      const fields = await prisma.departmentCustomField.findMany({
        where: {
          id: { in: fieldIds },
          companyId
        }
      });

      // Criar as associações em TemplateCustomField
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

    return NextResponse.json(templateWithFields, { status: 201 });
  } catch (error) {
    console.error('Error creating department template:', error);
    return NextResponse.json(
      { error: 'Erro ao criar template' },
      { status: 500 }
    );
  }
}
