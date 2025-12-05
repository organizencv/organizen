
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionManager } from '@/lib/session-manager';
import { prisma } from '@/lib/db';

/**
 * GET /api/sessions
 * Lista todas as sessões ativas do usuário atual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await SessionManager.getUserSessions(session.user.id);

    // Adicionar flag para indicar a sessão atual
    const currentSessionToken = (session as any).sessionToken;
    const sessionsWithCurrent = sessions.map((s: any) => ({
      ...s,
      isCurrent: s.sessionToken === currentSessionToken
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('[API] Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions
 * Remove todas as sessões exceto a atual
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentSessionToken = (session as any).sessionToken;

    // Buscar todas as sessões do usuário
    const allSessions = await SessionManager.getUserSessions(session.user.id);

    // Remover todas exceto a atual
    const sessionsToRemove = allSessions.filter((s: any) => s.sessionToken !== currentSessionToken);

    for (const sess of sessionsToRemove) {
      await SessionManager.removeSession(sess.sessionToken);
    }

    return NextResponse.json({
      message: 'All other sessions removed successfully',
      removedCount: sessionsToRemove.length
    });
  } catch (error) {
    console.error('[API] Error removing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to remove sessions' },
      { status: 500 }
    );
  }
}
