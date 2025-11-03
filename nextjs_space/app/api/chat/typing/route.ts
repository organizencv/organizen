
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST: Update typing status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isTyping, typingTo } = body;
    const userId = session.user.id;

    await prisma.userStatus.upsert({
      where: { userId },
      update: {
        isTyping,
        typingTo,
        lastActivity: new Date()
      },
      create: {
        userId,
        isOnline: true,
        isTyping,
        typingTo,
        lastSeen: new Date(),
        lastActivity: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update typing status error:', error);
    return NextResponse.json({ error: 'Failed to update typing status' }, { status: 500 });
  }
}
