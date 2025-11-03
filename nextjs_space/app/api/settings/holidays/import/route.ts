
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// POST - Importar feriados nacionais pré-definidos
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

    // Verificar permissão (apenas ADMIN pode importar)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { country, year } = body;

    if (!country || !year) {
      return NextResponse.json({ error: "País e ano são obrigatórios" }, { status: 400 });
    }

    // Feriados pré-definidos por país (2025)
    const holidaysData: Record<string, Array<{ name: string; date: string; isRecurring: boolean; description?: string }>> = {
      CV: [ // Cabo Verde 🇨🇻
        { name: "Ano Novo", date: "2025-01-01", isRecurring: true, description: "Celebração do primeiro dia do ano" },
        { name: "Dia dos Heróis Nacionais", date: "2025-01-20", isRecurring: true, description: "Homenagem a Amílcar Cabral" },
        { name: "Dia da Democracia", date: "2025-04-13", isRecurring: true, description: "Celebração da democracia em Cabo Verde" },
        { name: "Dia do Trabalhador", date: "2025-05-01", isRecurring: true, description: "Dia Internacional do Trabalhador" },
        { name: "Dia das Crianças", date: "2025-06-01", isRecurring: true, description: "Dia Internacional da Criança" },
        { name: "Dia da Independência", date: "2025-07-05", isRecurring: true, description: "Independência de Cabo Verde" },
        { name: "Dia de Nossa Senhora da Graça", date: "2025-08-15", isRecurring: true, description: "Padroeira de Cabo Verde" },
        { name: "Dia de Todos os Santos", date: "2025-11-01", isRecurring: true, description: "Celebração de Todos os Santos" },
        { name: "Natal", date: "2025-12-25", isRecurring: true, description: "Celebração do Nascimento de Jesus" },
      ],
      PT: [ // Portugal 🇵🇹
        { name: "Ano Novo", date: "2025-01-01", isRecurring: true },
        { name: "Sexta-feira Santa", date: "2025-04-18", isRecurring: false },
        { name: "Páscoa", date: "2025-04-20", isRecurring: false },
        { name: "Dia da Liberdade", date: "2025-04-25", isRecurring: true },
        { name: "Dia do Trabalhador", date: "2025-05-01", isRecurring: true },
        { name: "Corpo de Deus", date: "2025-06-19", isRecurring: false },
        { name: "Dia de Portugal", date: "2025-06-10", isRecurring: true },
        { name: "Assunção de Nossa Senhora", date: "2025-08-15", isRecurring: true },
        { name: "Implantação da República", date: "2025-10-05", isRecurring: true },
        { name: "Dia de Todos os Santos", date: "2025-11-01", isRecurring: true },
        { name: "Restauração da Independência", date: "2025-12-01", isRecurring: true },
        { name: "Imaculada Conceição", date: "2025-12-08", isRecurring: true },
        { name: "Natal", date: "2025-12-25", isRecurring: true },
      ],
      BR: [ // Brasil 🇧🇷
        { name: "Ano Novo", date: "2025-01-01", isRecurring: true },
        { name: "Carnaval", date: "2025-03-04", isRecurring: false },
        { name: "Sexta-feira Santa", date: "2025-04-18", isRecurring: false },
        { name: "Páscoa", date: "2025-04-20", isRecurring: false },
        { name: "Tiradentes", date: "2025-04-21", isRecurring: true },
        { name: "Dia do Trabalhador", date: "2025-05-01", isRecurring: true },
        { name: "Corpus Christi", date: "2025-06-19", isRecurring: false },
        { name: "Independência do Brasil", date: "2025-09-07", isRecurring: true },
        { name: "Nossa Senhora Aparecida", date: "2025-10-12", isRecurring: true },
        { name: "Dia de Finados", date: "2025-11-02", isRecurring: true },
        { name: "Proclamação da República", date: "2025-11-15", isRecurring: true },
        { name: "Consciência Negra", date: "2025-11-20", isRecurring: true },
        { name: "Natal", date: "2025-12-25", isRecurring: true },
      ],
    };

    const holidays = holidaysData[country];
    if (!holidays) {
      return NextResponse.json({ error: "País não suportado" }, { status: 400 });
    }

    // Criar feriados no banco de dados
    const createdHolidays = [];
    for (const holiday of holidays) {
      try {
        // Verificar se o feriado já existe
        const existing = await prisma.companyHoliday.findFirst({
          where: {
            companyId: user.companyId,
            name: holiday.name,
            date: new Date(holiday.date),
          },
        });

        if (!existing) {
          const created = await prisma.companyHoliday.create({
            data: {
              companyId: user.companyId,
              name: holiday.name,
              date: new Date(holiday.date),
              isRecurring: holiday.isRecurring,
              description: holiday.description,
            },
          });
          createdHolidays.push(created);
        }
      } catch (error) {
        console.error(`Erro ao importar feriado ${holiday.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      imported: createdHolidays.length,
      holidays: createdHolidays,
    });
  } catch (error) {
    console.error("Erro ao importar feriados:", error);
    return NextResponse.json(
      { error: "Erro ao importar feriados" },
      { status: 500 }
    );
  }
}
