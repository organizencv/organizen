
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionManager } from '@/lib/session-manager';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/sessions/[id]
 * Remove uma sessão específica
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;

    // Verificar se a sessão pertence ao usuário
    const activeSession = await prisma.activeSession.findUnique({
      where: { id: sessionId }
    });

    if (!activeSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (activeSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remover a sessão
    await SessionManager.removeSession(activeSession.sessionToken);

    return NextResponse.json({
      message: 'Session removed successfully'
    });
  } catch (error) {
    console.error('[API] Error removing session:', error);
    return NextResponse.json(
      { error: 'Failed to remove session' },
      { status: 500 }
    );
  }
}
