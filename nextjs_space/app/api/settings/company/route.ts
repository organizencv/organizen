
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';



export const dynamic = 'force-dynamic';

// GET - Buscar informações da empresa
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user.company);
  } catch (error) {
    console.error('Erro ao buscar informações da empresa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar informações da empresa' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar informações da empresa
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Apenas ADMIN pode editar
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const data = await req.json();

    // Validação básica
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar empresa
    const updatedCompany = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        taxId: data.taxId || null,
        defaultLanguage: data.defaultLanguage || 'pt',
        businessHours: data.businessHours || null,
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Erro ao atualizar informações da empresa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar informações da empresa' },
      { status: 500 }
    );
  }
}
