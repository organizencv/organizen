
import { prisma } from '@/lib/db';

export async function getBranding(companyId: string) {
  try {
    const branding = await prisma.companyBranding.findUnique({
      where: { companyId },
    });

    return branding;
  } catch (error) {
    console.error('Error fetching branding:', error);
    return null;
  }
}

export async function getOrCreateBranding(companyId: string) {
  try {
    let branding = await prisma.companyBranding.findUnique({
      where: { companyId },
    });

    if (!branding) {
      branding = await prisma.companyBranding.create({
        data: {
          companyId,
          primaryColor: '#3B82F6',
          theme: 'light',
          isActive: true,
        },
      });
    }

    return branding;
  } catch (error) {
    console.error('Error getting or creating branding:', error);
    return null;
  }
}
