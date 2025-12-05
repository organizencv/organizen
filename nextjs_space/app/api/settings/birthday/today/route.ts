
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Buscar aniversariantes do dia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Data de hoje
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate(); // 1-31

    // Buscar todos os usuários da empresa com birthDate
    const users = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
        birthDate: {
          not: null
        }
      },
      include: {
        team: {
          include: {
            department: true
          }
        }
      }
    });

    // Filtrar usuários que fazem aniversário hoje
    const todayBirthdays = users.filter(user => {
      if (!user.birthDate) return false;
      const birthDate = new Date(user.birthDate);
      return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay;
    });

    // Calcular idade de cada aniversariante
    const birthdaysWithAge = todayBirthdays.map(user => {
      const age = today.getFullYear() - new Date(user.birthDate!).getFullYear();
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        age,
        team: user.team ? {
          id: user.team.id,
          name: user.team.name,
          department: user.team.department ? {
            id: user.team.department.id,
            name: user.team.department.name
          } : null
        } : null
      };
    });

    return NextResponse.json({
      count: birthdaysWithAge.length,
      birthdays: birthdaysWithAge
    });

  } catch (error) {
    console.error('[Birthday Today GET] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar aniversariantes' },
      { status: 500 }
    );
  }
}
