

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendTestPush } from '@/lib/push-service';

// POST - Enviar notificação de teste
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const success = await sendTestPush(session.user.id);

    if (success) {
      return NextResponse.json({ success: true, message: 'Notificação enviada!' });
    } else {
      return NextResponse.json(
        { error: 'Nenhuma subscription ativa encontrada' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error sending test push:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar notificação de teste' },
      { status: 500 }
    );
  }
}
