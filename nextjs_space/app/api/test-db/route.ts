import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Tenta uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection OK',
      result 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
