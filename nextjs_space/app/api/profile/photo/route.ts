
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';

export async function POST(req: NextRequest) {
  try {
    console.log('[API] Iniciando upload de foto...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[API] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log('[API] Usuário autenticado:', session.user.id);
    const formData = await req.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      console.log('[API] Nenhum arquivo fornecido');
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    console.log('[API] Arquivo recebido:', file.name, file.type, file.size);

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.log('[API] Tipo de arquivo inválido:', file.type);
      return NextResponse.json({ 
        error: 'Tipo de arquivo inválido. Use JPG, PNG ou WebP' 
      }, { status: 400 });
    }

    // Validar tamanho (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('[API] Arquivo muito grande:', file.size);
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Tamanho máximo: 5MB' 
      }, { status: 400 });
    }

    // Buscar usuário atual
    console.log('[API] Buscando usuário no banco...');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Deletar foto antiga se existir
    if (user?.image) {
      try {
        console.log('[API] Deletando foto antiga:', user.image);
        await deleteFile(user.image);
        console.log('[API] Foto antiga deletada com sucesso');
      } catch (error) {
        console.error('[API] Erro ao deletar foto antiga:', error);
        // Continuar mesmo se falhar
      }
    }

    // Upload nova foto
    console.log('[API] Iniciando upload para S3...');
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-photos/${session.user.id}-${Date.now()}.${fileExtension}`;
    
    const photoUrl = await uploadFile(buffer, fileName);
    console.log('[API] Upload S3 concluído:', photoUrl);

    // Atualizar usuário no banco
    console.log('[API] Atualizando usuário no banco...');
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

    console.log('[API] Usuário atualizado com sucesso:', updatedUser.image);
    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      photoUrl 
    });
  } catch (error) {
    console.error('[API] Erro ao fazer upload da foto:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro ao fazer upload da foto' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('[API] Iniciando remoção de foto...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[API] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log('[API] Usuário autenticado:', session.user.id);

    // Buscar usuário atual
    console.log('[API] Buscando usuário no banco...');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Deletar foto se existir
    if (user?.image) {
      try {
        console.log('[API] Deletando foto do S3:', user.image);
        await deleteFile(user.image);
        console.log('[API] Foto deletada do S3 com sucesso');
      } catch (error) {
        console.error('[API] Erro ao deletar foto do S3:', error);
      }
    }

    // Remover foto do banco
    console.log('[API] Removendo foto do banco...');
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null }
    });

    console.log('[API] Foto removida do banco com sucesso');
    return NextResponse.json({ 
      success: true, 
      message: 'Foto removida com sucesso' 
    });
  } catch (error) {
    console.error('[API] Erro ao remover foto:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro ao remover foto' 
    }, { status: 500 });
  }
}
