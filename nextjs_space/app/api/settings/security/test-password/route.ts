

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Testar senha contra políticas
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { password } = await req.json();

    // Buscar configurações de segurança
    const securitySettings = await prisma.securitySettings.findUnique({
      where: { companyId: user.companyId },
    });

    if (!securitySettings) {
      return NextResponse.json({ error: 'Configurações de segurança não encontradas' }, { status: 404 });
    }

    // Validar senha contra políticas
    const errors: string[] = [];

    // Tamanho mínimo
    if (password.length < securitySettings.minPasswordLength) {
      errors.push(`A senha deve ter pelo menos ${securitySettings.minPasswordLength} caracteres`);
    }

    // Letra maiúscula
    if (securitySettings.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }

    // Letra minúscula
    if (securitySettings.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }

    // Números
    if (securitySettings.requireNumbers && !/\d/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }

    // Caracteres especiais
    if (securitySettings.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }

    if (errors.length > 0) {
      return NextResponse.json({ valid: false, errors }, { status: 200 });
    }

    return NextResponse.json({ valid: true, errors: [] }, { status: 200 });
  } catch (error) {
    console.error('Erro ao testar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao testar senha' },
      { status: 500 }
    );
  }
}
