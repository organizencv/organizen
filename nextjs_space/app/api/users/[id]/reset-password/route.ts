
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendNotificationEmail } from '@/lib/email';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only ADMIN and MANAGER can reset passwords
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify the user exists and belongs to the same company
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        company: true
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - User belongs to different company' },
        { status: 403 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword }
    });

    // Send notification email
    const companyId = targetUser.companyId;
    if (companyId) {
      try {
        await sendNotificationEmail(
          targetUser.email,
          targetUser.name || 'Usuário',
          companyId,
          targetUser.company.name,
          'Senha Redefinida',
          `Sua senha foi redefinida por um administrador.\n\nSe você não solicitou esta alteração, entre em contato com o administrador imediatamente.\n\nPor questões de segurança, recomendamos que você altere sua senha após fazer login.`
        );
        console.log('✅ Email de notificação enviado para:', targetUser.email);
      } catch (emailError) {
        console.error('⚠️ Erro ao enviar email de notificação:', emailError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
