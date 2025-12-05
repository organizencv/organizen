
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/settings/notifications/test-email - Enviar email de teste
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Email do usuário não encontrado' },
        { status: 404 }
      );
    }

    // TODO: Quando o sistema de email estiver configurado, enviar email real
    // Por enquanto, apenas simular o envio
    console.log(`📧 Email de teste enviado para: ${user.email}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Assunto: Teste de Notificações - OrganiZen`);
    console.log(`   Mensagem: Este é um email de teste para verificar suas preferências de notificações.`);

    return NextResponse.json({
      success: true,
      message: `Email de teste enviado para ${user.email}`,
      note: 'Aguardando configuração de domínio/SMTP para envio real',
    });
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar email de teste' },
      { status: 500 }
    );
  }
}
