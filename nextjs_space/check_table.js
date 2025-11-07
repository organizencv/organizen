require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTable() {
  try {
    console.log('Verificando tabela user_departments...')
    
    const count = await prisma.userDepartment.count()
    console.log('✓ Tabela existe! Total de registros:', count)
    
  } catch (error) {
    console.error('✗ Erro:', error.message)
    console.log('\nCriando tabela...')
    
    try {
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
      
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "user_departments_userId_departmentId_key" 
          ON "public"."user_departments"("userId", "departmentId");
      `)
      
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "user_departments_userId_idx" 
          ON "public"."user_departments"("userId");
      `)
      
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "user_departments_isActive_idx" 
          ON "public"."user_departments"("isActive");
      `)
      
      console.log('✓ Tabela criada com sucesso!')
      
      const newCount = await prisma.userDepartment.count()
      console.log('✓ Verificação final - Total de registros:', newCount)
      
    } catch (createError) {
      console.error('✗ Erro ao criar tabela:', createError.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkTable()
