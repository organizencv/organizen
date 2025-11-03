
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';

import { isValidHexColor } from '@/lib/branding/validate-colors';



export const dynamic = 'force-dynamic';

// GET - Obter configurações de branding
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    let branding = await prisma.companyBranding.findUnique({
      where: { companyId: user.companyId },
    });

    // Criar configuração padrão se não existir
    if (!branding) {
      branding = await prisma.companyBranding.create({
        data: {
          companyId: user.companyId,
          primaryColor: '#3B82F6',
          theme: 'light',
          isActive: true,
        },
      });
    }

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

// POST/PATCH - Atualizar configurações de branding
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    // Apenas ADMIN pode alterar branding
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar o branding' },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const body = await req.json();

    // Validar cores
    if (body.primaryColor && !isValidHexColor(body.primaryColor)) {
      return NextResponse.json(
        { error: 'Cor primária inválida' },
        { status: 400 }
      );
    }

    if (body.secondaryColor && !isValidHexColor(body.secondaryColor)) {
      return NextResponse.json(
        { error: 'Cor secundária inválida' },
        { status: 400 }
      );
    }

    if (body.accentColor && !isValidHexColor(body.accentColor)) {
      return NextResponse.json(
        { error: 'Cor de destaque inválida' },
        { status: 400 }
      );
    }

    // Atualizar ou criar branding
    const branding = await prisma.companyBranding.upsert({
      where: { companyId: user.companyId },
      update: {
        ...body,
        updatedAt: new Date(),
      },
      create: {
        companyId: user.companyId,
        primaryColor: body.primaryColor || '#3B82F6',
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        logoUrl: body.logoUrl,
        logoSize: body.logoSize,
        theme: body.theme || 'light',
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Error updating branding:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}

// DELETE - Resetar branding para padrão
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem resetar o branding' },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const branding = await prisma.companyBranding.update({
      where: { companyId: user.companyId },
      data: {
        logoUrl: null,
        logoSize: 150,
        primaryColor: '#3B82F6',
        secondaryColor: null,
        accentColor: null,
        theme: 'light',
        loginBackgroundType: 'gradient',
        loginBackgroundImage: null,
        loginBackgroundColor: null,
        welcomeMessage: null,
        tagline: null,
        supportLink: null,
        termsLink: null,
        privacyLink: null,
      },
    });

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Error resetting branding:', error);
    return NextResponse.json(
      { error: 'Erro ao resetar configurações' },
      { status: 500 }
    );
  }
}
