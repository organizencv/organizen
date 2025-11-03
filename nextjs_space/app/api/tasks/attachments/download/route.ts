
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDownloadUrl } from '@/lib/s3';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 });
    }

    const attachment = await prisma.taskAttachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Generate signed URL for download
    const signedUrl = await getDownloadUrl(attachment.cloud_storage_path);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Task attachment download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
