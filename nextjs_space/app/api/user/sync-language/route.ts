import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Sincronizar idioma do usuário com o idioma padrão da empresa
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Atualizar idioma do usuário com o idioma padrão da empresa
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        language: user.company.defaultLanguage,
      },
    });

    return NextResponse.json({
      message: 'Idioma sincronizado com sucesso',
      language: updatedUser.language,
    });
  } catch (error) {
    console.error('Erro ao sincronizar idioma:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar idioma' },
      { status: 500 }
    );
  }
}
