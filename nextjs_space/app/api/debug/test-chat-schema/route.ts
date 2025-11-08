
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Testar se a relação attachments existe no Prisma Client
    const testMessage = await prisma.chatMessage.findFirst({
      include: {
        attachments: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Relação attachments existe no Prisma Client',
      testMessage
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      prismaClientVersion: (prisma as any)._clientVersion || 'unknown'
    }, { status: 500 });
  }
}
