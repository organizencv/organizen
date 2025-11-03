
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// PUT - Atualizar feriado
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
    const { name, date, isRecurring, description } = body;

    // Verificar se o feriado pertence à empresa do usuário
    const existingHoliday = await prisma.companyHoliday.findUnique({
      where: { id: params.id },
    });

    if (!existingHoliday || existingHoliday.companyId !== user.companyId) {
      return NextResponse.json({ error: "Feriado não encontrado" }, { status: 404 });
    }

    const updatedHoliday = await prisma.companyHoliday.update({
      where: { id: params.id },
      data: {
        name: name ?? existingHoliday.name,
        date: date ? new Date(date) : existingHoliday.date,
        isRecurring: isRecurring !== undefined ? isRecurring : existingHoliday.isRecurring,
        description: description !== undefined ? description : existingHoliday.description,
      },
    });

    return NextResponse.json(updatedHoliday);
  } catch (error: any) {
    console.error("Erro ao atualizar feriado:", error);
    
    return NextResponse.json(
      { error: "Erro ao atualizar feriado" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar feriado
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

    // Verificar se o feriado pertence à empresa do usuário
    const existingHoliday = await prisma.companyHoliday.findUnique({
      where: { id: params.id },
    });

    if (!existingHoliday || existingHoliday.companyId !== user.companyId) {
      return NextResponse.json({ error: "Feriado não encontrado" }, { status: 404 });
    }

    await prisma.companyHoliday.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Feriado deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar feriado:", error);
    return NextResponse.json(
      { error: "Erro ao deletar feriado" },
      { status: 500 }
    );
  }
}
