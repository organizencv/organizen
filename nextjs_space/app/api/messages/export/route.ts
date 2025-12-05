import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messageIds, exportType } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;

    // Buscar mensagens
    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        companyId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (exportType === 'csv') {
      // Gerar CSV
      const csvHeaders = 'Data,Remetente,Destinatário,Assunto,Prioridade,Lida\n';
      const csvRows = messages.map(msg => {
        const date = format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm');
        const sender = msg.sender.name || msg.sender.email;
        const receiver = msg.receiver.name || msg.receiver.email;
        const subject = msg.subject.replace(/"/g, '""'); // Escape quotes
        const priority = msg.priority;
        const read = msg.read ? 'Sim' : 'Não';
        
        return `"${date}","${sender}","${receiver}","${subject}","${priority}","${read}"`;
      }).join('\n');

      const csv = csvHeaders + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="mensagens_${Date.now()}.csv"`,
        },
      });
    } else if (exportType === 'json') {
      // Retornar JSON para geração de PDF no cliente
      const exportData = messages.map(msg => ({
        date: format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm'),
        sender: msg.sender.name || msg.sender.email,
        receiver: msg.receiver.name || msg.receiver.email,
        subject: msg.subject,
        content: msg.content,
        priority: msg.priority,
        read: msg.read ? 'Sim' : 'Não',
      }));

      return NextResponse.json({ messages: exportData });
    }

    return NextResponse.json(
      { error: 'Invalid export type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
