
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// GET - Listar tipos de eventos customizados
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

    const eventTypes = await prisma.customEventType.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error("Erro ao buscar tipos de eventos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tipos de eventos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo tipo de evento
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

    // Verificar permissão (apenas ADMIN pode criar)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { name, color, icon, description, isDefault } = body;

    if (!name || !color) {
      return NextResponse.json({ error: "Nome e cor são obrigatórios" }, { status: 400 });
    }

    // Se isDefault = true, desmarcar outros defaults
    if (isDefault) {
      await prisma.customEventType.updateMany({
        where: { companyId: user.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const eventType = await prisma.customEventType.create({
      data: {
        companyId: user.companyId,
        name,
        color,
        icon,
        description,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(eventType, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar tipo de evento:", error);
    
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Já existe um tipo de evento com este nome" }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: "Erro ao criar tipo de evento" },
      { status: 500 }
    );
  }
}
