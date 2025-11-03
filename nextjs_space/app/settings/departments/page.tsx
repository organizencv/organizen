
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DepartmentStructureSettings } from '@/components/settings/DepartmentStructureSettings';

export const dynamic = "force-dynamic";

export default async function DepartmentStructurePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const companyId = session.user.companyId;

  // Buscar dados iniciais
  const [templatesRaw, customFieldsRaw, departmentsRaw] = await Promise.all([
    prisma.departmentTemplate.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { departments: true }
        },
        customFields: {
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.departmentCustomField.findMany({
      where: { companyId },
      orderBy: { order: 'asc' }
    }),
    prisma.department.findMany({
      where: { companyId },
      include: {
        template: {
          include: {
            customFields: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        },
        _count: {
          select: { users: true, teams: true }
        }
      },
      orderBy: { name: 'asc' }
    })
  ]);

  // Converter tipos nullable do Prisma para tipos compatíveis com os componentes
  const templates = templatesRaw.map((t: any) => ({
    ...t,
    description: t.description ?? undefined,
    defaultManagerRole: t.defaultManagerRole ?? undefined,
    customFields: t.customFields
  }));

  const customFields = customFieldsRaw.map((f: any) => ({
    ...f,
    fieldOptions: f.fieldOptions ?? undefined
  }));

  const departments = departmentsRaw.map((d: any) => ({
    ...d,
    templateId: d.templateId ?? undefined,
    customFieldsData: d.customFieldsData ?? undefined,
    template: d.template ? {
      ...d.template,
      description: d.template.description ?? undefined,
      defaultManagerRole: d.template.defaultManagerRole ?? undefined,
      customFields: d.template.customFields,
      _count: { departments: 0 } // Valor placeholder, não usado neste contexto
    } : undefined
  }));

  return (
    <DepartmentStructureSettings
      initialTemplates={templates}
      initialCustomFields={customFields}
      initialDepartments={departments}
    />
  );
}
