
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar registos de ponto
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const shiftAssignmentId = searchParams.get('shiftAssignmentId');
    const companyId = session.user.companyId;

    // Construir filtros
    const where: any = {
      shiftAssignment: {
        shift: {
          companyId,
        },
      },
    };

    // Filtro DIRETO por shiftAssignmentId (prioridade máxima)
    if (shiftAssignmentId) {
      where.shiftAssignmentId = shiftAssignmentId;
      // Quando busca por assignment específico, não precisa dos outros filtros
    } else {
      // Filtro por data (turnos desse dia)
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        where.shiftAssignment.shift.startTime = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Filtro por usuário
      if (userId) {
        where.shiftAssignment.userId = userId;
      }

      // Filtro por status
      if (status) {
        where.status = status;
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        shiftAssignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
            shift: {
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Erro ao buscar registos de ponto:', error);
    return NextResponse.json({ error: 'Erro ao buscar registos' }, { status: 500 });
  }
}

// POST - Criar ou atualizar registo de ponto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const {
      shiftAssignmentId,
      action, // 'clock_in', 'clock_out', 'mark_absent', 'justify_absence'
      latitude,
      longitude,
      justification,
      notes,
    } = data;

    if (!shiftAssignmentId || !action) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userRole = session.user.role;

    // Buscar configurações
    const settings = await prisma.attendanceSettings.findUnique({
      where: { companyId },
    });

    // Se não existir settings, criar com valores padrão
    const effectiveSettings = settings || {
      allowManagerClockIn: true,
      allowSelfClockIn: false,
      requireGPS: false,
      maxGPSRadiusMeters: 100,
      companyLatitude: null,
      companyLongitude: null,
      lateToleranceMinutes: 15,
      earlyDepartureMinutes: 15,
      notifyOnLate: true,
      notifyOnAbsent: true,
    };

    // Buscar shift assignment
    const shiftAssignment = await prisma.shiftAssignment.findUnique({
      where: { id: shiftAssignmentId },
      include: {
        shift: true,
        user: true,
      },
    });

    if (!shiftAssignment) {
      return NextResponse.json(
        { error: 'Atribuição de turno não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissões
    const isManager = ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(userRole);
    const isSelfClocking = shiftAssignment.userId === userId;

    if (!isManager && !isSelfClocking) {
      return NextResponse.json(
        { error: 'Sem permissão para registar ponto de outro colaborador' },
        { status: 403 }
      );
    }

    if (isSelfClocking && !effectiveSettings.allowSelfClockIn && action !== 'clock_in' && action !== 'clock_out') {
      return NextResponse.json(
        { error: 'Auto-registo não permitido pela empresa' },
        { status: 403 }
      );
    }

    // Validar GPS se necessário
    if (effectiveSettings.requireGPS && (action === 'clock_in' || action === 'clock_out')) {
      if (!latitude || !longitude) {
        return NextResponse.json(
          { error: 'Localização GPS obrigatória' },
          { status: 400 }
        );
      }

      if (effectiveSettings.companyLatitude && effectiveSettings.companyLongitude) {
        const distance = calculateDistance(
          latitude,
          longitude,
          effectiveSettings.companyLatitude,
          effectiveSettings.companyLongitude
        );

        if (distance > effectiveSettings.maxGPSRadiusMeters) {
          return NextResponse.json(
            { error: `Você está a ${Math.round(distance)}m da empresa. Máximo permitido: ${effectiveSettings.maxGPSRadiusMeters}m` },
            { status: 400 }
          );
        }
      }
    }

    // Buscar ou criar attendance
    let attendance = await prisma.attendance.findUnique({
      where: { shiftAssignmentId },
    });

    const now = new Date();

    // Processar ação
    switch (action) {
      case 'clock_in':
        if (attendance && attendance.clockInTime) {
          return NextResponse.json(
            { error: 'Entrada já registada' },
            { status: 400 }
          );
        }

        // Calcular atraso
        const shiftStart = new Date(shiftAssignment.shift.startTime);
        const minutesLate = Math.max(0, Math.floor((now.getTime() - shiftStart.getTime()) / 60000));
        const isLate = minutesLate > effectiveSettings.lateToleranceMinutes;

        attendance = await prisma.attendance.upsert({
          where: { shiftAssignmentId },
          update: {
            clockInTime: now,
            clockInLatitude: latitude,
            clockInLongitude: longitude,
            minutesLate: isLate ? minutesLate : 0,
            status: isLate ? 'LATE' : 'PRESENT',
            clockedInBy: isSelfClocking ? null : userId,
            notes: notes || undefined,
          },
          create: {
            shiftAssignmentId,
            clockInTime: now,
            clockInLatitude: latitude,
            clockInLongitude: longitude,
            minutesLate: isLate ? minutesLate : 0,
            status: isLate ? 'LATE' : 'PRESENT',
            clockedInBy: isSelfClocking ? null : userId,
            notes,
          },
        });
        break;

      case 'clock_out':
        if (!attendance || !attendance.clockInTime) {
          return NextResponse.json(
            { error: 'Entrada não registada' },
            { status: 400 }
          );
        }

        if (attendance.clockOutTime) {
          return NextResponse.json(
            { error: 'Saída já registada' },
            { status: 400 }
          );
        }

        // Calcular saída antecipada e tempo trabalhado
        const shiftEnd = new Date(shiftAssignment.shift.endTime);
        const minutesEarly = Math.max(0, Math.floor((shiftEnd.getTime() - now.getTime()) / 60000));
        const isEarlyDeparture = minutesEarly > effectiveSettings.earlyDepartureMinutes;
        const totalMinutes = Math.floor((now.getTime() - attendance.clockInTime.getTime()) / 60000);

        let newStatus = attendance.status;
        if (isEarlyDeparture && newStatus === 'PRESENT') {
          newStatus = 'EARLY_DEPARTURE';
        }

        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            clockOutTime: now,
            clockOutLatitude: latitude,
            clockOutLongitude: longitude,
            minutesEarly: isEarlyDeparture ? minutesEarly : 0,
            totalMinutes,
            status: newStatus,
            clockedOutBy: isSelfClocking ? null : userId,
            notes: notes || attendance.notes,
          },
        });
        break;

      case 'mark_absent':
        if (!isManager) {
          return NextResponse.json(
            { error: 'Apenas gestores podem marcar faltas' },
            { status: 403 }
          );
        }

        const absentStatus = justification ? 'ABSENT_JUSTIFIED' : 'ABSENT_UNJUSTIFIED';

        attendance = await prisma.attendance.upsert({
          where: { shiftAssignmentId },
          update: {
            status: absentStatus,
            justification,
            justifiedBy: userId,
            notes: notes || undefined,
          },
          create: {
            shiftAssignmentId,
            status: absentStatus,
            justification,
            justifiedBy: userId,
            notes,
          },
        });
        break;

      case 'justify_absence':
        if (!isManager) {
          return NextResponse.json(
            { error: 'Apenas gestores podem justificar faltas' },
            { status: 403 }
          );
        }

        if (!attendance) {
          return NextResponse.json(
            { error: 'Registo de ponto não encontrado' },
            { status: 404 }
          );
        }

        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            status: 'ABSENT_JUSTIFIED',
            justification,
            justifiedBy: userId,
            notes: notes || attendance.notes,
          },
        });
        break;

      case 'manual_entry':
        // Apenas gestores podem fazer registo manual
        if (!isManager) {
          return NextResponse.json(
            { error: 'Apenas gestores podem fazer registo manual' },
            { status: 403 }
          );
        }

        // Validar que clockInTime e clockOutTime foram fornecidos
        if (!data.clockInTime || !data.clockOutTime) {
          return NextResponse.json(
            { error: 'Horários de entrada e saída são obrigatórios' },
            { status: 400 }
          );
        }

        const manualClockIn = new Date(data.clockInTime);
        const manualClockOut = new Date(data.clockOutTime);

        // Validar que saída é depois da entrada
        if (manualClockOut <= manualClockIn) {
          return NextResponse.json(
            { error: 'Hora de saída deve ser depois da hora de entrada' },
            { status: 400 }
          );
        }

        // Calcular métricas
        const shiftStartManual = new Date(shiftAssignment.shift.startTime);
        const shiftEndManual = new Date(shiftAssignment.shift.endTime);
        
        const minutesLateManual = Math.max(0, Math.floor((manualClockIn.getTime() - shiftStartManual.getTime()) / 60000));
        const isLateManual = minutesLateManual > effectiveSettings.lateToleranceMinutes;
        
        const minutesEarlyManual = Math.max(0, Math.floor((shiftEndManual.getTime() - manualClockOut.getTime()) / 60000));
        const isEarlyManual = minutesEarlyManual > effectiveSettings.earlyDepartureMinutes;
        
        const totalMinutesManual = Math.floor((manualClockOut.getTime() - manualClockIn.getTime()) / 60000);
        
        // Determinar status
        let statusManual: 'PRESENT' | 'LATE' | 'EARLY_DEPARTURE' = 'PRESENT';
        if (isLateManual) {
          statusManual = 'LATE';
        } else if (isEarlyManual) {
          statusManual = 'EARLY_DEPARTURE';
        }

        // Criar ou atualizar registo
        attendance = await prisma.attendance.upsert({
          where: { shiftAssignmentId },
          update: {
            clockInTime: manualClockIn,
            clockOutTime: manualClockOut,
            status: statusManual as any,
            minutesLate: isLateManual ? minutesLateManual : 0,
            minutesEarly: isEarlyManual ? minutesEarlyManual : 0,
            totalMinutes: totalMinutesManual,
            notes: notes || undefined,
          },
          create: {
            shiftAssignmentId,
            clockInTime: manualClockIn,
            clockOutTime: manualClockOut,
            status: statusManual as any,
            minutesLate: isLateManual ? minutesLateManual : 0,
            minutesEarly: isEarlyManual ? minutesEarlyManual : 0,
            totalMinutes: totalMinutesManual,
            notes,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

    // Retornar com dados completos
    const fullAttendance = await prisma.attendance.findUnique({
      where: { id: attendance.id },
      include: {
        shiftAssignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
            shift: {
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(fullAttendance);
  } catch (error) {
    console.error('Erro ao processar registo de ponto:', error);
    return NextResponse.json({ error: 'Erro ao processar registo' }, { status: 500 });
  }
}

// Função auxiliar para calcular distância entre duas coordenadas (fórmula de Haversine)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
