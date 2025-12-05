
import { prisma } from './db';
import { UAParser } from 'ua-parser-js';

interface CreateSessionParams {
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionManager {
  /**
   * Cria uma nova sessão e verifica o limite de sessões concorrentes
   */
  static async createSession(params: CreateSessionParams): Promise<void> {
    const { userId, sessionToken, expiresAt, ipAddress, userAgent } = params;

    // Parse user agent para extrair device info
    const device = userAgent ? this.parseUserAgent(userAgent) : undefined;

    // Buscar configurações de segurança da empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            securitySettings: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const maxSessions = user.company.securitySettings?.maxConcurrentSessions || 3;

    // PRIMEIRO: Verificar e remover sessões antigas se necessário ANTES de criar a nova
    await this.enforceSessionLimit(userId, maxSessions - 1); // -1 porque vamos criar uma nova

    // SEGUNDO: Criar a nova sessão
    await prisma.activeSession.create({
      data: {
        userId,
        sessionToken,
        ipAddress,
        userAgent,
        device,
        expiresAt,
        lastActivity: new Date()
      }
    });

    console.log(`[SessionManager] Created session for user ${userId}, max allowed: ${maxSessions}`);

    // Limpar sessões expiradas (cleanup oportunista)
    await this.cleanupExpiredSessions();
  }

  /**
   * Enforce the maximum concurrent sessions limit
   */
  static async enforceSessionLimit(userId: string, maxSessions: number): Promise<void> {
    // Buscar todas as sessões ativas do usuário, ordenadas por lastActivity
    const activeSessions = await prisma.activeSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        lastActivity: 'asc' // Mais antigas primeiro
      }
    });

    // Se excedeu o limite, remover as sessões mais antigas
    const sessionsToRemove = activeSessions.length - maxSessions;
    if (sessionsToRemove > 0) {
      const sessionsToDelete = activeSessions.slice(0, sessionsToRemove);
      const tokenIds = sessionsToDelete.map((s: any) => s.id);

      await prisma.activeSession.deleteMany({
        where: {
          id: { in: tokenIds }
        }
      });

      console.log(`[SessionManager] Removed ${sessionsToRemove} old session(s) for user ${userId}`);
    }
  }

  /**
   * Atualiza a última atividade de uma sessão
   */
  static async updateActivity(sessionToken: string): Promise<void> {
    try {
      await prisma.activeSession.update({
        where: { sessionToken },
        data: { lastActivity: new Date() }
      });
    } catch (error) {
      // Session might not exist yet, ignore
    }
  }

  /**
   * Remove uma sessão específica
   */
  static async removeSession(sessionToken: string): Promise<void> {
    try {
      await prisma.activeSession.delete({
        where: { sessionToken }
      });
    } catch (error) {
      // Session might not exist, ignore
    }
  }

  /**
   * Remove todas as sessões de um usuário
   */
  static async removeAllUserSessions(userId: string): Promise<void> {
    await prisma.activeSession.deleteMany({
      where: { userId }
    });
  }

  /**
   * Lista todas as sessões ativas de um usuário
   */
  static async getUserSessions(userId: string) {
    return await prisma.activeSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });
  }

  /**
   * Limpa sessões expiradas (cleanup automático)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const deleted = await prisma.activeSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    if (deleted.count > 0) {
      console.log(`[SessionManager] Cleaned up ${deleted.count} expired session(s)`);
    }
  }

  /**
   * Parse user agent string para extrair informações do device
   */
  private static parseUserAgent(userAgent: string): string {
    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      
      const browser = result.browser.name || 'Unknown Browser';
      const os = result.os.name || 'Unknown OS';
      const device = result.device.type || 'desktop';
      
      return `${browser} / ${os} (${device})`;
    } catch (error) {
      return 'Unknown Device';
    }
  }
}
