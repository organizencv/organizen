export type Expense = {
  id: string
  amount: number
  category: string
  description: string
  date: Date
}

export type ExpenseFormData = Omit<Expense, 'id' | 'date'> & {
  date: string
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Other'
] as const

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

// CompanyBranding type - matches Prisma schema
export type CompanyBranding = {
  id: string
  companyId: string
  
  // Logotipo
  logoUrl: string | null
  logoSize: number | null
  
  // Cores Corporativas
  primaryColor: string
  secondaryColor: string | null
  accentColor: string | null
  
  // Tela de Login/Signup
  loginBackgroundType: string
  loginBackgroundImage: string | null
  loginBackgroundColor: string | null
  welcomeMessage: string | null
  tagline: string | null
  
  // Links Personalizados
  supportLink: string | null
  termsLink: string | null
  privacyLink: string | null
  
  // Tema
  theme: string
  
  // Subdomínio
  customSubdomain: string | null
  customDomain: string | null
  
  // Configurações de Email
  emailHeaderColor: string | null
  emailSignature: string | null
  
  // Templates de Email
  emailSenderName: string | null
  emailFooter: string | null
  
  emailWelcomeSubject: string | null
  emailWelcomeBody: string | null
  emailWelcomeEnabled: boolean
  
  emailResetSubject: string | null
  emailResetBody: string | null
  emailResetEnabled: boolean
  
  emailInviteSubject: string | null
  emailInviteBody: string | null
  emailInviteEnabled: boolean
  
  emailNotifySubject: string | null
  emailNotifyBody: string | null
  emailNotifyEnabled: boolean
  
  // Metadados
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}