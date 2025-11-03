
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se o usuário é ADMIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido. Use SVG, PNG ou JPG.' },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Diretório já existe
    }

    // Gerar nome único para o arquivo
    const ext = file.name.split('.').pop();
    const fileName = `pwa-icon-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    // Atualizar no banco de dados
    await prisma.company.update({
      where: { id: user.companyId! },
      data: { pwaIcon: fileUrl },
    });

    // TODO: Gerar ícones em múltiplos tamanhos
    // TODO: Atualizar manifest.json dinamicamente

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Erro ao fazer upload do ícone PWA:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Remover ícone PWA da empresa
    await prisma.company.update({
      where: { id: user.companyId! },
      data: { pwaIcon: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover ícone PWA:', error);
    return NextResponse.json({ error: 'Erro ao remover ícone PWA' }, { status: 500 });
  }
}
