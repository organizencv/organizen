
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/db';

import { uploadFile, deleteFile } from '@/lib/s3';



export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    // Apenas ADMIN pode fazer upload de logo
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar o logo' },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PNG, JPG ou SVG.' },
        { status: 400 }
      );
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 2MB.' },
        { status: 400 }
      );
    }

    // Converter para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Gerar nome único com folderPrefix incluído
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const { folderPrefix } = await import('@/lib/aws-config').then(m => m.getBucketConfig());
    const fileName = `${folderPrefix}logos/${user.companyId}/${timestamp}-${sanitizedName}`;

    // Upload para S3
    const cloud_storage_path = await uploadFile(buffer, fileName);

    // Buscar branding atual para deletar logo antigo
    const currentBranding = await prisma.companyBranding.findUnique({
      where: { companyId: user.companyId },
      select: { logoUrl: true },
    });

    // Deletar logo antigo se existir
    if (currentBranding?.logoUrl) {
      try {
        // Extrair apenas a chave do S3 (sem a URL completa)
        const oldKey = currentBranding.logoUrl.split('/').slice(-3).join('/');
        await deleteFile(oldKey);
      } catch (error) {
        console.error('Error deleting old logo:', error);
        // Continuar mesmo se falhar a exclusão do logo antigo
      }
    }

    // Atualizar ou criar branding com novo logo
    const branding = await prisma.companyBranding.upsert({
      where: { companyId: user.companyId },
      update: {
        logoUrl: cloud_storage_path,
        updatedAt: new Date(),
      },
      create: {
        companyId: user.companyId,
        logoUrl: cloud_storage_path,
        primaryColor: '#3B82F6',
        theme: 'light',
        isActive: true,
      },
    });

    return NextResponse.json({
      logoUrl: cloud_storage_path,
      message: 'Logo atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do logo' },
      { status: 500 }
    );
  }
}

// DELETE - Remover logo
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem remover o logo' },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const branding = await prisma.companyBranding.findUnique({
      where: { companyId: user.companyId },
      select: { logoUrl: true },
    });

    if (branding?.logoUrl) {
      try {
        const key = branding.logoUrl.split('/').slice(-3).join('/');
        await deleteFile(key);
      } catch (error) {
        console.error('Error deleting logo from S3:', error);
      }
    }

    // Atualizar branding removendo logo
    await prisma.companyBranding.update({
      where: { companyId: user.companyId },
      data: {
        logoUrl: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Logo removido com sucesso' });
  } catch (error) {
    console.error('Error removing logo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover logo' },
      { status: 500 }
    );
  }
}
