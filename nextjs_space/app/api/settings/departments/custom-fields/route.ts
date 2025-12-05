
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/settings/departments/custom-fields - Listar campos customizados
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const customFields = await prisma.departmentCustomField.findMany({
      where: { companyId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(customFields);
  } catch (error) {
    console.error('Error fetching department custom fields:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar campos customizados' },
      { status: 500 }
    );
  }
}

// POST /api/settings/departments/custom-fields - Criar campo customizado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas ADMIN pode criar campos customizados
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fieldName, fieldType, fieldOptions, isRequired, order } = body;

    if (!fieldName || !fieldType) {
      return NextResponse.json(
        { error: 'Nome e tipo do campo são obrigatórios' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;

    // Verificar se já existe um campo com esse nome
    const existing = await prisma.departmentCustomField.findUnique({
      where: {
        companyId_fieldName: {
          companyId,
          fieldName
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um campo com esse nome' },
        { status: 400 }
      );
    }

    const customField = await prisma.departmentCustomField.create({
      data: {
        companyId,
        fieldName,
        fieldType,
        fieldOptions,
        isRequired: isRequired || false,
        order: order || 0
      }
    });

    return NextResponse.json(customField, { status: 201 });
  } catch (error) {
    console.error('Error creating department custom field:', error);
    return NextResponse.json(
      { error: 'Erro ao criar campo customizado' },
      { status: 500 }
    );
  }
}
