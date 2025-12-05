import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyMessageReceived } from '@/lib/notification-triggers';

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
    const { recipientIds, subject, content, priority } = body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: 'Recipient IDs are required and must be an array' },
        { status: 400 }
      );
    }

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    const senderId = session.user.id;

    // Criar mensagens para cada destinatário
    const createdMessages = await Promise.all(
      recipientIds.map(async (receiverId) => {
        const message = await prisma.message.create({
          data: {
            subject,
            content,
            priority: priority || 'NORMAL',
            companyId,
            senderId,
            receiverId,
            read: false,
            isDraft: false,
          },
          include: {
            sender: {
              select: { id: true, name: true, email: true, role: true }
            },
            receiver: {
              select: { id: true, name: true, email: true, role: true }
            },
          }
        });

        // Enviar notificação para o destinatário
        try {
          await notifyMessageReceived({
            receiverId: message.receiverId,
            senderId: message.senderId,
            senderName: message.sender.name || message.sender.email,
            subject: message.subject,
            messageId: message.id,
          });
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }

        return message;
      })
    );

    return NextResponse.json({
      success: true,
      count: createdMessages.length,
      messages: createdMessages
    });

  } catch (error) {
    console.error('Bulk messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
