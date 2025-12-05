

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Registrar nova subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { endpoint, keys, userAgent } = await req.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Dados de subscription inválidos' },
        { status: 400 }
      );
    }

    // Verificar se já existe subscription com esse endpoint
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    });

    if (existing) {
      // Atualizar userId se necessário (caso seja outro usuário no mesmo dispositivo)
      if (existing.userId !== session.user.id) {
        await prisma.pushSubscription.update({
          where: { endpoint },
          data: {
            userId: session.user.id,
            p256dh: keys.p256dh,
            auth: keys.auth,
            userAgent: userAgent || null
          }
        });
      }
      return NextResponse.json({ success: true, updated: true });
    }

    // Criar nova subscription
    const subscription = await prisma.pushSubscription.create({
      data: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null
      }
    });

    return NextResponse.json({ success: true, subscription }, { status: 201 });
  } catch (error) {
    console.error('Error registering push subscription:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Remover subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint é obrigatório' },
        { status: 400 }
      );
    }

    // Remover subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json(
      { error: 'Erro ao remover subscription' },
      { status: 500 }
    );
  }
}

// GET - Listar subscriptions do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true
      }
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar subscriptions' },
      { status: 500 }
    );
  }
}
