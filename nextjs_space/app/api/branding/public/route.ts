
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDownloadUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyEmail = searchParams.get('email');

    if (!companyEmail) {
      return NextResponse.json(
        { error: 'Email da empresa não fornecido' },
        { status: 400 }
      );
    }

    // Buscar empresa pelo email
    const company = await prisma.company.findUnique({
      where: { email: companyEmail },
      include: {
        branding: true,
      },
    });

    if (!company || !company.branding) {
      // Retornar branding padrão
      return NextResponse.json({
        hasCustomBranding: false,
        primaryColor: '#3B82F6',
        companyName: companyEmail.split('@')[0],
      });
    }

    const branding = company.branding;

    // Gerar URLs assinadas para logo e background
    let logoUrl = null;
    let backgroundUrl = null;

    if (branding.logoUrl) {
      try {
        logoUrl = await getDownloadUrl(branding.logoUrl);
      } catch (error) {
        console.error('Error generating logo URL:', error);
      }
    }

    if (branding.loginBackgroundImage) {
      try {
        backgroundUrl = await getDownloadUrl(branding.loginBackgroundImage);
      } catch (error) {
        console.error('Error generating background URL:', error);
      }
    }

    return NextResponse.json({
      hasCustomBranding: branding.isActive,
      companyName: company.name,
      logoUrl,
      logoSize: branding.logoSize,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      loginBackgroundType: branding.loginBackgroundType,
      loginBackgroundImage: backgroundUrl,
      loginBackgroundColor: branding.loginBackgroundColor,
      welcomeMessage: branding.welcomeMessage,
      tagline: branding.tagline,
      supportLink: branding.supportLink,
      termsLink: branding.termsLink,
      privacyLink: branding.privacyLink,
    });
  } catch (error) {
    console.error('Public branding error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar branding' },
      { status: 500 }
    );
  }
}
