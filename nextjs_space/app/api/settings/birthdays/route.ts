
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Obter configurações de aniversários
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Buscar ou criar configurações padrão
    let settings = await prisma.birthdaySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    // Se não existir, criar com valores padrão
    if (!settings) {
      settings = await prisma.birthdaySettings.create({
        data: {
          companyId: session.user.companyId,
          enabled: true,
          visibility: 'ALL',
          notifyBirthdayPerson: true,
          notifyTeamMembers: true,
          notifyManagers: true,
        },
      });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Birthday settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações de aniversários
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      enabled,
      visibility,
      notifyBirthdayPerson,
      notifyTeamMembers,
      notifyManagers,
      customMessage,
    } = body;

    // Validar visibility
    if (visibility && !['ALL', 'SAME_DEPARTMENT', 'MANAGERS_ONLY'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value' },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (notifyBirthdayPerson !== undefined) updateData.notifyBirthdayPerson = notifyBirthdayPerson;
    if (notifyTeamMembers !== undefined) updateData.notifyTeamMembers = notifyTeamMembers;
    if (notifyManagers !== undefined) updateData.notifyManagers = notifyManagers;
    if (customMessage !== undefined) updateData.customMessage = customMessage;

    // Atualizar ou criar configurações
    const settings = await prisma.birthdaySettings.upsert({
      where: { companyId: session.user.companyId },
      update: updateData,
      create: {
        companyId: session.user.companyId,
        enabled: enabled ?? true,
        visibility: visibility ?? 'ALL',
        notifyBirthdayPerson: notifyBirthdayPerson ?? true,
        notifyTeamMembers: notifyTeamMembers ?? true,
        notifyManagers: notifyManagers ?? true,
        customMessage: customMessage || null,
      },
    });

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Birthday settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
