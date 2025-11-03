
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// PUT - Atualizar tipo de evento
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

    // Verificar permissão (apenas ADMIN pode editar)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { name, color, icon, description, isDefault } = body;

    // Verificar se o tipo de evento pertence à empresa do usuário
    const existingEventType = await prisma.customEventType.findUnique({
      where: { id: params.id },
    });

    if (!existingEventType || existingEventType.companyId !== user.companyId) {
      return NextResponse.json({ error: "Tipo de evento não encontrado" }, { status: 404 });
    }

    // Se isDefault = true, desmarcar outros defaults
    if (isDefault) {
      await prisma.customEventType.updateMany({
        where: { 
          companyId: user.companyId, 
          isDefault: true,
          id: { not: params.id }
        },
        data: { isDefault: false },
      });
    }

    const updatedEventType = await prisma.customEventType.update({
      where: { id: params.id },
      data: {
        name,
        color,
        icon,
        description,
        isDefault: isDefault ?? existingEventType.isDefault,
      },
    });

    return NextResponse.json(updatedEventType);
  } catch (error: any) {
    console.error("Erro ao atualizar tipo de evento:", error);
    
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Já existe um tipo de evento com este nome" }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: "Erro ao atualizar tipo de evento" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar tipo de evento
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

    // Verificar permissão (apenas ADMIN pode deletar)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Verificar se o tipo de evento pertence à empresa do usuário
    const existingEventType = await prisma.customEventType.findUnique({
      where: { id: params.id },
    });

    if (!existingEventType || existingEventType.companyId !== user.companyId) {
      return NextResponse.json({ error: "Tipo de evento não encontrado" }, { status: 404 });
    }

    // TODO: Verificar se há eventos usando este tipo antes de deletar
    // (implementar lógica de validação futura)

    await prisma.customEventType.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Tipo de evento deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar tipo de evento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar tipo de evento" },
      { status: 500 }
    );
  }
}
