

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { archived } = await request.json();
    const messageId = params.id;

    // Verify message belongs to the user
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        archived,
        folderId: archived ? message.folderId : null // Clear folder if unarchiving
      }
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Archive message error:', error);
    return NextResponse.json({ error: 'Failed to archive message' }, { status: 500 });
  }
}
