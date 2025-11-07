
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('Criando tabela user_departments...')
    
    // Criar tabela
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."user_departments" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "departmentId" TEXT NOT NULL,
        "role" TEXT,
        "teamId" TEXT,
        "availability" INTEGER NOT NULL DEFAULT 100,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "user_departments_pkey" PRIMARY KEY ("id")
      );
    `)
    
    // Criar índices
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "user_departments_userId_departmentId_key" 
        ON "public"."user_departments"("userId", "departmentId");
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "user_departments_userId_idx" 
        ON "public"."user_departments"("userId");
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "user_departments_departmentId_idx" 
        ON "public"."user_departments"("departmentId");
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "user_departments_isActive_idx" 
        ON "public"."user_departments"("isActive");
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "user_departments_isPrimary_idx" 
        ON "public"."user_departments"("isPrimary");
    `)
    
    console.log('✓ Tabela criada com sucesso!')
    
    // Verificar
    const count = await prisma.userDepartment.count()
    console.log('✓ Verificação - Total de registros:', count)
    
    return NextResponse.json({
      success: true,
      message: 'Tabela user_departments criada com sucesso!',
      count
    })
    
  } catch (error: any) {
    console.error('Erro ao criar tabela:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
