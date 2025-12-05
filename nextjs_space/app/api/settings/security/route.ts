

import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';



export const dynamic = 'force-dynamic';

// GET - Buscar configurações de segurança
export async function GET(req: NextRequest) {
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

    // Buscar ou criar configurações de segurança
    let securitySettings = await prisma.securitySettings.findUnique({
      where: { companyId: user.companyId },
    });

    // Se não existir, criar com valores padrão
    if (!securitySettings) {
      securitySettings = await prisma.securitySettings.create({
        data: {
          companyId: user.companyId,
        },
      });
    }

    return NextResponse.json(securitySettings);
  } catch (error) {
    console.error('Erro ao buscar configurações de segurança:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações de segurança' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações de segurança
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
    if (data.minPasswordLength && (data.minPasswordLength < 4 || data.minPasswordLength > 128)) {
      return NextResponse.json(
        { error: 'Tamanho mínimo da senha deve estar entre 4 e 128 caracteres' },
        { status: 400 }
      );
    }

    if (data.sessionTimeoutMinutes && (data.sessionTimeoutMinutes < 5 || data.sessionTimeoutMinutes > 10080)) {
      return NextResponse.json(
        { error: 'Timeout de sessão deve estar entre 5 minutos e 7 dias' },
        { status: 400 }
      );
    }

    if (data.maxConcurrentSessions && (data.maxConcurrentSessions < 1 || data.maxConcurrentSessions > 10)) {
      return NextResponse.json(
        { error: 'Máximo de sessões concorrentes deve estar entre 1 e 10' },
        { status: 400 }
      );
    }

    // Atualizar ou criar configurações
    const securitySettings = await prisma.securitySettings.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        ...data,
      },
      update: data,
    });

    return NextResponse.json(securitySettings);
  } catch (error) {
    console.error('Erro ao atualizar configurações de segurança:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações de segurança' },
      { status: 500 }
    );
  }
}
