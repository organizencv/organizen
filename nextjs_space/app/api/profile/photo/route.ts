
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo inválido. Use JPG, PNG ou WebP' 
      }, { status: 400 });
    }

    // Validar tamanho (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Tamanho máximo: 5MB' 
      }, { status: 400 });
    }

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Deletar foto antiga se existir
    if (user?.image) {
      try {
        await deleteFile(user.image);
      } catch (error) {
        console.error('Erro ao deletar foto antiga:', error);
        // Continuar mesmo se falhar
      }
    }

    // Upload nova foto
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-photos/${session.user.id}-${Date.now()}.${fileExtension}`;
    
    const photoUrl = await uploadFile(buffer, fileName);

    // Atualizar usuário no banco
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: photoUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      photoUrl 
    });
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    return NextResponse.json({ 
      error: 'Erro ao fazer upload da foto' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Deletar foto se existir
    if (user?.image) {
      try {
        await deleteFile(user.image);
      } catch (error) {
        console.error('Erro ao deletar foto:', error);
      }
    }

    // Remover foto do banco
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Foto removida com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    return NextResponse.json({ 
      error: 'Erro ao remover foto' 
    }, { status: 500 });
  }
}
