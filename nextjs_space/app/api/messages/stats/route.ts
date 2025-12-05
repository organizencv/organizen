import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Total de mensagens enviadas
    const totalSent = await prisma.message.count({
      where: {
        companyId,
        senderId: userId,
        isDraft: false,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Total de mensagens recebidas
    const totalReceived = await prisma.message.count({
      where: {
        companyId,
        receiverId: userId,
        isDraft: false,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Mensagens não lidas
    const unreadCount = await prisma.message.count({
      where: {
        companyId,
        receiverId: userId,
        read: false,
        isDraft: false,
      },
    });

    // Mensagens por dia (últimos N dias)
    const messagesPerDay = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const sent = await prisma.message.count({
        where: {
          companyId,
          senderId: userId,
          isDraft: false,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const received = await prisma.message.count({
        where: {
          companyId,
          receiverId: userId,
          isDraft: false,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      messagesPerDay.push({
        date: format(date, 'dd/MM'),
        sent,
        received,
      });
    }

    // Mensagens por prioridade
    const messagesByPriority = await prisma.message.groupBy({
      by: ['priority'],
      where: {
        companyId,
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        isDraft: false,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    // Top remetentes (mensagens recebidas)
    const topSenders = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        companyId,
        receiverId: userId,
        isDraft: false,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
      orderBy: {
        _count: {
          senderId: 'desc',
        },
      },
      take: 5,
    });

    // Buscar nomes dos top remetentes
    const senderIds = topSenders.map(s => s.senderId);
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, email: true },
    });

    const topSendersWithNames = topSenders.map(sender => {
      const user = senders.find(u => u.id === sender.senderId);
      return {
        name: user?.name || user?.email || 'Desconhecido',
        count: sender._count,
      };
    });

    return NextResponse.json({
      summary: {
        totalSent,
        totalReceived,
        unreadCount,
        total: totalSent + totalReceived,
      },
      messagesPerDay,
      messagesByPriority,
      topSenders: topSendersWithNames,
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
