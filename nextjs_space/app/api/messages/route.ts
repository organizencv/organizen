
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { notifyMessageReceived } from '@/lib/notification-triggers';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const draftsOnly = searchParams.get('drafts') === 'true';
    
    // Filtros avançados
    const senderId = searchParams.get('senderId');
    const receiverId = searchParams.get('receiverId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const priority = searchParams.get('priority');
    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');

    // Se solicitar apenas rascunhos
    if (draftsOnly) {
      const drafts = await prisma.message.findMany({
        where: {
          companyId,
          senderId: userId,
          isDraft: true,
          deleted: false,
        },
        include: {
          receiver: {
            select: { id: true, name: true, email: true, role: true }
          },
          attachments: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(drafts);
    }

    // Construir filtros dinâmicos
    const whereClause: any = {
      companyId,
      isDraft: false,
    };

    // Aplicar filtro de remetente
    if (senderId) {
      whereClause.senderId = senderId;
    }

    // Aplicar filtro de destinatário
    if (receiverId) {
      whereClause.receiverId = receiverId;
    } else {
      // Se não especificado, mostrar apenas mensagens recebidas pelo usuário atual
      whereClause.receiverId = userId;
    }

    // Aplicar filtro de data
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Adicionar 23:59:59 ao endDate para incluir todo o dia
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDateTime;
      }
    }

    // Aplicar filtro de prioridade
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    // Aplicar filtro de pasta
    if (folderId && folderId !== 'all') {
      whereClause.folderId = folderId;
    }

    // Aplicar busca de texto
    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(messages);

  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      subject, 
      content, 
      receiverId, 
      attachmentIds,
      priority = 'NORMAL',
      isDraft = false,
      replyToId,
      recipientsTo = [],
      recipientsCC = [],
      recipientsBCC = [],
      scheduledFor
    } = await request.json();

    console.log('📨 API: Recebendo dados da mensagem:', {
      subject,
      receiverId,
      attachmentIds,
      totalAnexos: attachmentIds?.length || 0,
      isDraft
    });

    // Buscar assinatura do usuário e adicionar ao conteúdo se não for rascunho
    let finalContent = content;
    if (!isDraft) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailSignature: true }
      });

      if (user?.emailSignature) {
        finalContent = `${content}<br/><br/>${user.emailSignature}`;
      }
    }

    // Criar mensagem
    const message = await prisma.message.create({
      data: {
        subject,
        content: finalContent,
        senderId: session.user.id,
        receiverId, // Mantido para compatibilidade
        companyId: session.user.companyId,
        priority,
        isDraft,
        replyToId,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        },
        attachments: true,
        replyTo: {
          select: { id: true, subject: true, sender: { select: { name: true, email: true } } }
        }
      }
    });

    // Criar destinatários (TO, CC, BCC)
    const recipientData = [];
    
    // TO recipients
    if (recipientsTo && recipientsTo.length > 0) {
      recipientData.push(...recipientsTo.map((userId: string) => ({
        messageId: message.id,
        userId,
        type: 'TO' as const
      })));
    } else {
      // Compatibilidade: se não houver recipientsTo, usa receiverId como TO
      recipientData.push({
        messageId: message.id,
        userId: receiverId,
        type: 'TO' as const
      });
    }

    // CC recipients
    if (recipientsCC && recipientsCC.length > 0) {
      recipientData.push(...recipientsCC.map((userId: string) => ({
        messageId: message.id,
        userId,
        type: 'CC' as const
      })));
    }

    // BCC recipients
    if (recipientsBCC && recipientsBCC.length > 0) {
      recipientData.push(...recipientsBCC.map((userId: string) => ({
        messageId: message.id,
        userId,
        type: 'BCC' as const
      })));
    }

    // Criar todos os destinatários
    if (recipientData.length > 0) {
      await prisma.messageRecipient.createMany({
        data: recipientData
      });
    }

    // Vincular anexos temporários à mensagem
    if (attachmentIds && attachmentIds.length > 0) {
      console.log('📎 API: Vinculando anexos à mensagem', {
        messageId: message.id,
        attachmentIds,
        totalAnexos: attachmentIds.length
      });
      
      const updateResult = await prisma.attachment.updateMany({
        where: {
          id: { in: attachmentIds }
        },
        data: {
          messageId: message.id
        }
      });
      
      console.log('✅ API: Anexos vinculados:', updateResult);
    } else {
      console.log('⚠️ API: Nenhum anexo para vincular');
    }

    // Enviar notificações push (apenas se não for rascunho)
    if (!isDraft) {
      const allRecipientIds = [...recipientsTo, ...recipientsCC];
      if (allRecipientIds.length === 0) {
        allRecipientIds.push(receiverId);
      }

      // Enviar notificação para todos os destinatários (exceto BCC para privacidade)
      for (const recipientId of allRecipientIds) {
        notifyMessageReceived({
          receiverId: recipientId,
          senderId: session.user.id,
          senderName: session.user.name || 'Usuário',
          subject,
          messageId: message.id
        }).catch(err => console.error('Error sending notification:', err));
      }
    }

    // Revalidate relevant pages
    revalidatePath('/messages');

    return NextResponse.json(message);

  } catch (error) {
    console.error('Message creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
