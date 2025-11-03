
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';



export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const branding = await prisma.companyBranding.findUnique({
      where: { companyId: user.companyId },
      select: {
        emailSenderName: true,
        emailFooter: true,
        emailWelcomeSubject: true,
        emailWelcomeBody: true,
        emailWelcomeEnabled: true,
        emailResetSubject: true,
        emailResetBody: true,
        emailResetEnabled: true,
        emailInviteSubject: true,
        emailInviteBody: true,
        emailInviteEnabled: true,
        emailNotifySubject: true,
        emailNotifyBody: true,
        emailNotifyEnabled: true,
      },
    });

    return NextResponse.json(branding || {});
  } catch (error) {
    console.error('Erro ao buscar templates de email:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar templates de email' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Apenas admins podem editar templates
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem editar templates de email' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Remove companyId do data para evitar erro
    const { companyId: _, ...updateData } = data;

    const branding = await prisma.companyBranding.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Erro ao atualizar templates de email:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar templates de email' },
      { status: 500 }
    );
  }
}
