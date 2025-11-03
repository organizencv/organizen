
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// PUT - Atualizar template de turno
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verificar permissão (ADMIN ou MANAGER podem editar)
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { name, startTime, endTime, breakDuration, color, description } = body;

    // Verificar se o template pertence à empresa do usuário
    const existingTemplate = await prisma.shiftTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate || existingTemplate.companyId !== user.companyId) {
      return NextResponse.json({ error: "Template de turno não encontrado" }, { status: 404 });
    }

    // Validar formato de horário (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if ((startTime && !timeRegex.test(startTime)) || (endTime && !timeRegex.test(endTime))) {
      return NextResponse.json({ error: "Formato de horário inválido. Use HH:mm" }, { status: 400 });
    }

    const updatedTemplate = await prisma.shiftTemplate.update({
      where: { id: params.id },
      data: {
        name: name ?? existingTemplate.name,
        startTime: startTime ?? existingTemplate.startTime,
        endTime: endTime ?? existingTemplate.endTime,
        breakDuration: breakDuration !== undefined ? breakDuration : existingTemplate.breakDuration,
        color: color ?? existingTemplate.color,
        description: description !== undefined ? description : existingTemplate.description,
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error: any) {
    console.error("Erro ao atualizar template de turno:", error);
    
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Já existe um template de turno com este nome" }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: "Erro ao atualizar template de turno" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar template de turno
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verificar permissão (ADMIN ou MANAGER podem deletar)
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Verificar se o template pertence à empresa do usuário
    const existingTemplate = await prisma.shiftTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate || existingTemplate.companyId !== user.companyId) {
      return NextResponse.json({ error: "Template de turno não encontrado" }, { status: 404 });
    }

    await prisma.shiftTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Template de turno deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar template de turno:", error);
    return NextResponse.json(
      { error: "Erro ao deletar template de turno" },
      { status: 500 }
    );
  }
}
