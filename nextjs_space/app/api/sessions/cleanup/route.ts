
import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager';

/**
 * POST /api/sessions/cleanup
 * Limpa sessões expiradas (pode ser chamado por um cron job)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se tem uma chave de API para proteger o endpoint
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.CRON_SECRET || 'development-secret';

    if (apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await SessionManager.cleanupExpiredSessions();

    return NextResponse.json({
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    console.error('[API] Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
