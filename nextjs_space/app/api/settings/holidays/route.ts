
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// GET - Listar feriados da empresa
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: "Usuário não associado a empresa" }, { status: 400 });
    }

    const holidays = await prisma.companyHoliday.findMany({
      where: { companyId: user.companyId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Erro ao buscar feriados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar feriados" },
      { status: 500 }
    );
  }
}

// POST - Criar novo feriado
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: "Usuário não associado a empresa" }, { status: 400 });
    }

    // Verificar permissão (ADMIN ou MANAGER podem criar)
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { name, date, isRecurring, description } = body;

    if (!name || !date) {
      return NextResponse.json({ error: "Nome e data são obrigatórios" }, { status: 400 });
    }

    const holiday = await prisma.companyHoliday.create({
      data: {
        companyId: user.companyId,
        name,
        date: new Date(date),
        isRecurring: isRecurring || false,
        description,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar feriado:", error);
    
    return NextResponse.json(
      { error: "Erro ao criar feriado" },
      { status: 500 }
    );
  }
}
