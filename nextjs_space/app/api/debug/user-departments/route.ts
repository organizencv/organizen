
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Testar se a tabela existe
    const count = await prisma.userDepartment.count()
    
    // Testar findUnique com constraint
    const test = await prisma.userDepartment.findUnique({
      where: {
        userId_departmentId: {
          userId: 'test',
          departmentId: 'test',
        },
      },
    })
    
    return NextResponse.json({
      success: true,
      count,
      uniqueConstraintTest: 'OK',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
