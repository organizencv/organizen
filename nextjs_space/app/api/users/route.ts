
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        department: true,
        team: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, email, password, role, departmentId, teamId } = await request.json();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Buscar idioma padrão da empresa
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { defaultLanguage: true }
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        language: company?.defaultLanguage || 'pt', // Usa idioma padrão da empresa
        companyId: session.user.companyId,
        departmentId: departmentId || null,
        teamId: teamId || null,
      },
      include: {
        department: true,
        team: true,
        company: true,
      }
    });

    // Enviar email de boas-vindas
    try {
      await sendWelcomeEmail(
        email,
        name,
        session.user.companyId,
        user.company.name
      );
      console.log('✅ Email de boas-vindas enviado para:', email);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de boas-vindas:', emailError);
      // Não bloqueia a criação do utilizador se o email falhar
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/users');

    return NextResponse.json(user);

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
