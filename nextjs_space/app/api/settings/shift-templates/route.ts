
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// GET - Listar templates de turnos
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

    const shiftTemplates = await prisma.shiftTemplate.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(shiftTemplates);
  } catch (error) {
    console.error("Erro ao buscar templates de turnos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar templates de turnos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo template de turno
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
    const { name, startTime, endTime, breakDuration, color, description } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: "Nome, horário de início e fim são obrigatórios" }, { status: 400 });
    }

    // Validar formato de horário (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({ error: "Formato de horário inválido. Use HH:mm" }, { status: 400 });
    }

    const shiftTemplate = await prisma.shiftTemplate.create({
      data: {
        companyId: user.companyId,
        name,
        startTime,
        endTime,
        breakDuration: breakDuration || null,
        color: color || "#3B82F6",
        description,
      },
    });

    return NextResponse.json(shiftTemplate, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar template de turno:", error);
    
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Já existe um template de turno com este nome" }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: "Erro ao criar template de turno" },
      { status: 500 }
    );
  }
}
