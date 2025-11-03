
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { notifyMessageReceived } from '@/lib/notification-triggers';

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

    const messages = await prisma.message.findMany({
      where: {
        companyId,
        receiverId: userId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(messages);

  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subject, content, receiverId, attachmentIds } = await request.json();

    const message = await prisma.message.create({
      data: {
        subject,
        content,
        senderId: session.user.id,
        receiverId,
        companyId: session.user.companyId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        },
        attachments: true
      }
    });

    // Vincular anexos temporários à mensagem
    if (attachmentIds && attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: {
          id: { in: attachmentIds }
        },
        data: {
          messageId: message.id
        }
      });
    }

    // Enviar notificação push para o destinatário
    notifyMessageReceived({
      receiverId,
      senderId: session.user.id,
      senderName: session.user.name || 'Usuário',
      subject,
      messageId: message.id
    }).catch(err => console.error('Error sending notification:', err));

    // Revalidate relevant pages
    revalidatePath('/messages');

    return NextResponse.json(message);

  } catch (error) {
    console.error('Message creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
