
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Get user status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let status = await prisma.userStatus.findUnique({
      where: { userId }
    });

    if (!status) {
      // Create default status if it doesn't exist
      status = await prisma.userStatus.create({
        data: {
          userId,
          isOnline: false,
          lastSeen: new Date(),
          isTyping: false
        }
      });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Fetch status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

// PATCH: Update user status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isOnline, isTyping, typingTo } = body;
    const userId = session.user.id;

    const status = await prisma.userStatus.upsert({
      where: { userId },
      update: {
        ...(isOnline !== undefined && { isOnline }),
        ...(isTyping !== undefined && { isTyping }),
        ...(typingTo !== undefined && { typingTo }),
        lastSeen: new Date(),
        lastActivity: new Date()
      },
      create: {
        userId,
        isOnline: isOnline ?? false,
        isTyping: isTyping ?? false,
        typingTo: typingTo ?? null,
        lastSeen: new Date(),
        lastActivity: new Date()
      }
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
