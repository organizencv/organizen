

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PATCH update folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, color } = await request.json();
    const folderId = params.id;

    // Verify folder belongs to the user
    const folder = await prisma.messageFolder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id
      }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const updatedFolder = await prisma.messageFolder.update({
      where: { id: folderId },
      data: { 
        ...(name && { name: name.trim() }),
        ...(color && { color })
      },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error('Update folder error:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

// DELETE folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const folderId = params.id;

    // Verify folder belongs to the user
    const folder = await prisma.messageFolder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id
      }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Delete folder (messages will have folderId set to null due to onDelete: SetNull)
    await prisma.messageFolder.delete({
      where: { id: folderId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
