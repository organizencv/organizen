

import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';



export const dynamic = 'force-dynamic';

// Lista de timezones válidos (principais)
const VALID_TIMEZONES = [
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Berlin',
  'Europe/Rome',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Buenos_Aires',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Africa/Johannesburg',
  'UTC',
];

// Formatos de data válidos
const VALID_DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD.MM.YYYY',
  'DD-MM-YYYY',
];

// Formatos de hora válidos
const VALID_TIME_FORMATS = ['12h', '24h'];

// Moedas válidas (principais)
const VALID_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'BRL', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'CHF', 'MXN', 'ARS',
];

// GET - Buscar configurações regionais
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user || !user.company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    const regionalSettings = {
      timezone: user.company.timezone,
      dateFormat: user.company.dateFormat,
      timeFormat: user.company.timeFormat,
      firstDayOfWeek: user.company.firstDayOfWeek,
      currency: user.company.currency,
    };

    return NextResponse.json(regionalSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações regionais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações regionais
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user || !user.company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissões (apenas ADMIN)
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar configurações regionais' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { timezone, dateFormat, timeFormat, firstDayOfWeek, currency } = body;

    // Validações
    const errors: string[] = [];

    if (timezone && !VALID_TIMEZONES.includes(timezone)) {
      errors.push('Fuso horário inválido');
    }

    if (dateFormat && !VALID_DATE_FORMATS.includes(dateFormat)) {
      errors.push('Formato de data inválido');
    }

    if (timeFormat && !VALID_TIME_FORMATS.includes(timeFormat)) {
      errors.push('Formato de hora inválido');
    }

    if (firstDayOfWeek !== undefined && (firstDayOfWeek < 0 || firstDayOfWeek > 6)) {
      errors.push('Primeiro dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)');
    }

    if (currency && !VALID_CURRENCIES.includes(currency)) {
      errors.push('Código de moeda inválido');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    // Atualizar apenas os campos fornecidos
    const updateData: any = {};
    if (timezone) updateData.timezone = timezone;
    if (dateFormat) updateData.dateFormat = dateFormat;
    if (timeFormat) updateData.timeFormat = timeFormat;
    if (firstDayOfWeek !== undefined) updateData.firstDayOfWeek = firstDayOfWeek;
    if (currency) updateData.currency = currency;

    const updatedCompany = await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
    });

    const regionalSettings = {
      timezone: updatedCompany.timezone,
      dateFormat: updatedCompany.dateFormat,
      timeFormat: updatedCompany.timeFormat,
      firstDayOfWeek: updatedCompany.firstDayOfWeek,
      currency: updatedCompany.currency,
    };

    return NextResponse.json(regionalSettings);
  } catch (error) {
    console.error('Erro ao atualizar configurações regionais:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
