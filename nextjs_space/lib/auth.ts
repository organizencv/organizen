
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { SessionManager } from './session-manager';
import crypto from 'crypto';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            company: {
              include: {
                securitySettings: true
              }
            }
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Verificar se o sistema de aprovação está ativado
        const requireApproval = user.company.securitySettings?.requireApproval ?? false;
        
        // Se a aprovação é obrigatória e o usuário não está aprovado, bloquear login
        if (requireApproval && !user.approved) {
          throw new Error('PENDING_APPROVAL');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          image: user.image || undefined,
          role: user.role,
          companyId: user.companyId,
          language: user.language
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas (padrão)
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
        token.language = (user as any).language;
        token.image = (user as any).image;
        
        // Gerar um session token único para rastreamento
        const sessionToken = crypto.randomBytes(32).toString('hex');
        token.sessionToken = sessionToken;
        
        // Buscar configurações de segurança para obter o timeout
        const company = await prisma.company.findUnique({
          where: { id: (user as any).companyId },
          include: { securitySettings: true }
        });
        
        const sessionTimeoutMinutes = company?.securitySettings?.sessionTimeoutMinutes || 480; // 8 horas padrão
        const expiresAt = new Date(Date.now() + sessionTimeoutMinutes * 60 * 1000);
        
        // Registrar a nova sessão e verificar limites
        try {
          await SessionManager.createSession({
            userId: user.id,
            sessionToken,
            expiresAt,
            ipAddress: undefined, // Será preenchido pela API
            userAgent: undefined  // Será preenchido pela API
          });
        } catch (error) {
          console.error('[Auth] Error creating session:', error);
        }
      }
      
      // CRITICAL: Validar se a sessão ainda existe na tabela ActiveSession
      // Se foi removida (ex: pelo admin ou por limite de sessões), invalida o token
      if (token.sessionToken && token.sub && !user) {
        try {
          const sessionExists = await prisma.activeSession.findUnique({
            where: { sessionToken: token.sessionToken as string }
          });
          
          // Se a sessão não existe mais, retorna null para forçar logout
          if (!sessionExists) {
            console.log(`[Auth] Session ${token.sessionToken} was removed, forcing logout`);
            return null as any;
          }
        } catch (error) {
          console.error('[Auth] Error validating session:', error);
          // Em caso de erro, mantém o token para não deslogar por erro de DB
        }
      }
      
      // When session update is triggered, fetch fresh user data from database
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { language: true, role: true }
        });
        if (dbUser) {
          token.language = dbUser.language;
          token.role = dbUser.role;
        }
      }
      
      // Atualizar atividade da sessão
      if (token.sessionToken && token.sub) {
        try {
          await SessionManager.updateActivity(token.sessionToken as string);
        } catch (error) {
          // Ignore errors
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.language = token.language as string;
        session.user.image = token.image as string | null;
        (session as any).sessionToken = token.sessionToken as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  events: {
    async signOut({ token }) {
      // Remover a sessão quando o usuário fizer logout
      if (token?.sessionToken) {
        try {
          await SessionManager.removeSession(token.sessionToken as string);
        } catch (error) {
          console.error('[Auth] Error removing session on signOut event:', error);
        }
      }
    }
  },
  logger: {
    error: (code: any, metadata: any) => {
      // Suprimir erros conhecidos do preview
      if (typeof code === 'string' && code.includes('digest:')) return;
      console.error(code, metadata);
    },
    warn: (code: any) => {
      // Suprimir warnings conhecidos do preview
      if (typeof code === 'string' && code.includes('digest:')) return;
      console.warn(code);
    },
    debug: () => {}, // Desabilitar logs de debug
  },
  debug: false, // Desabilitar modo debug em produção
};
