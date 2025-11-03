

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

    const { folderId } = await request.json();
    const messageId = params.id;

    // Verify message belongs to the user and is archived
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        archived: true,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or not archived' }, { status: 404 });
    }

    // If folderId is provided, verify it belongs to the user
    if (folderId) {
      const folder = await prisma.messageFolder.findFirst({
        where: {
          id: folderId,
          userId: session.user.id
        }
      });

      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }
    }

    // Update message folder
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { folderId: folderId || null }
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Move message error:', error);
    return NextResponse.json({ error: 'Failed to move message' }, { status: 500 });
  }
}
