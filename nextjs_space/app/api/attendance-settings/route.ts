
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obter configurações de ponto
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Buscar configurações ou criar com valores padrão
    let settings = await prisma.attendanceSettings.findUnique({
      where: { companyId },
    });

    // Se não existir, criar com valores padrão
    if (!settings) {
      settings = await prisma.attendanceSettings.create({
        data: {
          companyId,
          allowManagerClockIn: true,
          allowSelfClockIn: false,
          requireGPS: false,
          maxGPSRadiusMeters: 100,
          lateToleranceMinutes: 15,
          earlyDepartureMinutes: 15,
          notifyOnLate: true,
          notifyOnAbsent: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações de ponto:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

// PUT - Atualizar configurações de ponto
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas ADMIN pode alterar configurações
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const companyId = session.user.companyId;
    const data = await request.json();

    // Validações
    if (data.maxGPSRadiusMeters && (data.maxGPSRadiusMeters < 10 || data.maxGPSRadiusMeters > 5000)) {
      return NextResponse.json(
        { error: 'Raio GPS deve estar entre 10 e 5000 metros' },
        { status: 400 }
      );
    }

    if (data.lateToleranceMinutes && (data.lateToleranceMinutes < 0 || data.lateToleranceMinutes > 120)) {
      return NextResponse.json(
        { error: 'Tolerância deve estar entre 0 e 120 minutos' },
        { status: 400 }
      );
    }

    // Atualizar ou criar configurações
    const settings = await prisma.attendanceSettings.upsert({
      where: { companyId },
      update: {
        allowManagerClockIn: data.allowManagerClockIn,
        allowSelfClockIn: data.allowSelfClockIn,
        requireGPS: data.requireGPS,
        maxGPSRadiusMeters: data.maxGPSRadiusMeters,
        companyLatitude: data.companyLatitude,
        companyLongitude: data.companyLongitude,
        lateToleranceMinutes: data.lateToleranceMinutes,
        earlyDepartureMinutes: data.earlyDepartureMinutes,
        notifyOnLate: data.notifyOnLate,
        notifyOnAbsent: data.notifyOnAbsent,
      },
      create: {
        companyId,
        allowManagerClockIn: data.allowManagerClockIn ?? true,
        allowSelfClockIn: data.allowSelfClockIn ?? false,
        requireGPS: data.requireGPS ?? false,
        maxGPSRadiusMeters: data.maxGPSRadiusMeters ?? 100,
        companyLatitude: data.companyLatitude,
        companyLongitude: data.companyLongitude,
        lateToleranceMinutes: data.lateToleranceMinutes ?? 15,
        earlyDepartureMinutes: data.earlyDepartureMinutes ?? 15,
        notifyOnLate: data.notifyOnLate ?? true,
        notifyOnAbsent: data.notifyOnAbsent ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao atualizar configurações de ponto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
