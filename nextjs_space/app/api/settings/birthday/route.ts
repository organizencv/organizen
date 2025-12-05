
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Buscar configurações de aniversário da empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Buscar ou criar configurações
    let settings = await prisma.birthdaySettings.findUnique({
      where: { companyId: session.user.companyId }
    });

    // Se não existir, criar com valores padrão
    if (!settings) {
      settings = await prisma.birthdaySettings.create({
        data: {
          companyId: session.user.companyId,
          enabled: true,
          messageTemplate: '🎉 Feliz Aniversário, {{name}}! 🎂\n\nHoje é um dia especial! Toda a equipe do {{companyName}} deseja a você muita saúde, alegria e sucesso!\n\n🎈 Parabéns! 🎈',
          sendTime: '09:00',
          notifyBirthdayPerson: true,
          notifyManagers: true,
          notifyTeamMembers: true,
          visibility: 'PUBLIC'
        }
      });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('[Birthday Settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar configurações de aniversário
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apenas ADMIN pode editar
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can edit birthday settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      enabled,
      messageTemplate,
      sendTime,
      notifyBirthdayPerson,
      notifyManagers,
      notifyTeamMembers,
      visibility
    } = body;

    // Validações
    if (typeof enabled !== 'undefined' && typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled deve ser um boolean' },
        { status: 400 }
      );
    }

    if (sendTime && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(sendTime)) {
      return NextResponse.json(
        { error: 'sendTime deve estar no formato HH:mm (ex: 09:00)' },
        { status: 400 }
      );
    }

    if (visibility && !['PUBLIC', 'PRIVATE', 'TEAM_ONLY'].includes(visibility)) {
      return NextResponse.json(
        { error: 'visibility deve ser PUBLIC, PRIVATE ou TEAM_ONLY' },
        { status: 400 }
      );
    }

    // Atualizar ou criar configurações
    const settings = await prisma.birthdaySettings.upsert({
      where: { companyId: session.user.companyId },
      update: {
        enabled,
        messageTemplate,
        sendTime,
        notifyBirthdayPerson,
        notifyManagers,
        notifyTeamMembers,
        visibility,
        updatedAt: new Date()
      },
      create: {
        companyId: session.user.companyId,
        enabled: enabled ?? true,
        messageTemplate: messageTemplate ?? '🎉 Feliz Aniversário, {{name}}! 🎂',
        sendTime: sendTime ?? '09:00',
        notifyBirthdayPerson: notifyBirthdayPerson ?? true,
        notifyManagers: notifyManagers ?? true,
        notifyTeamMembers: notifyTeamMembers ?? true,
        visibility: visibility ?? 'PUBLIC'
      }
    });

    console.log('[Birthday Settings PUT] Settings updated:', settings);

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('[Birthday Settings PUT] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
