
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { companyName, email, password, fullName } = await request.json();

    // Check if company email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company and first admin user in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: email,
          defaultLanguage: 'pt', // Idioma padrão para novos usuários
        }
      });

      // Create default department
      const department = await tx.department.create({
        data: {
          name: 'Geral',
          companyId: company.id,
        }
      });

      // Create default team
      const team = await tx.team.create({
        data: {
          name: 'Equipe 1',
          departmentId: department.id,
        }
      });

      // Create admin user (primeiro usuário é automaticamente aprovado)
      const user = await tx.user.create({
        data: {
          name: fullName,
          email: email,
          password: hashedPassword,
          role: 'ADMIN',
          language: company.defaultLanguage || 'pt', // Usa idioma padrão da empresa
          companyId: company.id,
          departmentId: department.id,
          teamId: team.id,
          approved: true, // Primeiro usuário (admin) é automaticamente aprovado
          approvedAt: new Date(),
          approvedBy: null, // Autoatribuído (primeiro admin)
        }
      });

      return { company, user };
    });

    // Send welcome email (não bloqueia o cadastro em caso de erro)
    try {
      await sendWelcomeEmail(
        email,
        fullName,
        result.company.id,
        companyName
      );
      console.log('✅ Email de boas-vindas enviado para:', email);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de boas-vindas:', emailError);
      // Não bloqueia o cadastro se o email falhar
    }

    return NextResponse.json({
      message: 'Empresa registada com sucesso',
      companyId: result.company.id,
      userId: result.user.id
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
