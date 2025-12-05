
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

/**
 * POST /api/users/approval/[id]
 * Aprovar um usuário
 * Apenas para ADMIN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas ADMIN pode aprovar usuários
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem aprovar usuários.' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Verificar se o usuário existe e pertence à mesma empresa
    const userToApprove = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToApprove) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (userToApprove.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Usuário pertence a outra empresa.' },
        { status: 403 }
      );
    }

    if (userToApprove.approved) {
      return NextResponse.json(
        { error: 'Usuário já está aprovado' },
        { status: 400 }
      );
    }

    // Aprovar o usuário
    const approvedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        approved: true,
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        approvedAt: true,
      }
    });

    // Criar notificação para o usuário aprovado
    await prisma.notification.create({
      data: {
        userId: userId,
        title: 'Conta Aprovada',
        message: 'Sua conta foi aprovada! Agora você pode acessar o sistema.',
        type: 'SYSTEM',
        read: false,
      }
    });

    console.log(`✅ Usuário ${approvedUser.email} aprovado por ${session.user.email}`);

    return NextResponse.json({
      message: 'Usuário aprovado com sucesso',
      user: approvedUser
    });

  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar usuário' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/approval/[id]
 * Rejeitar/remover um usuário pendente
 * Apenas para ADMIN
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas ADMIN pode rejeitar usuários
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem rejeitar usuários.' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Verificar se o usuário existe e pertence à mesma empresa
    const userToReject = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToReject) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (userToReject.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Usuário pertence a outra empresa.' },
        { status: 403 }
      );
    }

    if (userToReject.approved) {
      return NextResponse.json(
        { error: 'Não é possível remover um usuário já aprovado. Use a função de desativar usuário.' },
        { status: 400 }
      );
    }

    // Remover o usuário
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`🗑️ Usuário ${userToReject.email} rejeitado e removido por ${session.user.email}`);

    return NextResponse.json({
      message: 'Usuário removido com sucesso'
    });

  } catch (error) {
    console.error('Error rejecting user:', error);
    return NextResponse.json(
      { error: 'Erro ao remover usuário' },
      { status: 500 }
    );
  }
}
