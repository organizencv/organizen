
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/email';

// GET /api/teams/:id/members - Obter membros de uma equipa
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const members = await prisma.user.findMany({
      where: { teamId: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
  }
}

// POST /api/teams/:id/members - Adicionar membro à equipa
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // STAFF não pode adicionar membros
    if (user.role === 'STAFF') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();

    // Get team info
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: { 
        department: {
          include: { company: true }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 });
    }

    // Get user being added
    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Atualizar teamId do usuário (remove automaticamente da lista de espera)
    await prisma.user.update({
      where: { id: data.userId },
      data: { 
        teamId: params.id,
        // Garantir que sai da lista de espera ao ser adicionado a uma equipa
      }
    });

    // Send notification email
    const companyId = targetUser.companyId;
    if (companyId) {
      try {
        await sendNotificationEmail(
          targetUser.email,
          targetUser.name || 'Usuário',
          companyId,
          team.department.company.name,
          `Adicionado à equipe ${team.name}`,
          `Você foi adicionado à equipe "${team.name}" no departamento "${team.department.name}".\n\nBem-vindo à equipe!`
        );
        console.log('✅ Email de notificação de equipe enviado para:', targetUser.email);
      } catch (emailError) {
        console.error('⚠️ Erro ao enviar email de notificação:', emailError);
      }
    }

    return NextResponse.json({ message: 'Membro adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 });
  }
}
