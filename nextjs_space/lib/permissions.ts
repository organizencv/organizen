
// Sistema de Controle de Acesso Baseado em Função (RBAC)
// Hierarquia Rígida

export enum Permission {
  // Usuários
  VIEW_ALL_USERS = 'VIEW_ALL_USERS',
  VIEW_DEPARTMENT_USERS = 'VIEW_DEPARTMENT_USERS',
  VIEW_TEAM_USERS = 'VIEW_TEAM_USERS',
  CREATE_USER = 'CREATE_USER',
  EDIT_USER = 'EDIT_USER',
  DELETE_USER = 'DELETE_USER',
  
  // Departamentos e Equipes
  MANAGE_DEPARTMENTS = 'MANAGE_DEPARTMENTS',
  MANAGE_TEAMS = 'MANAGE_TEAMS',
  VIEW_DEPARTMENTS = 'VIEW_DEPARTMENTS',
  VIEW_TEAMS = 'VIEW_TEAMS',
  
  // Tarefas
  CREATE_TASK = 'CREATE_TASK',
  EDIT_OWN_TASK = 'EDIT_OWN_TASK',
  EDIT_TEAM_TASK = 'EDIT_TEAM_TASK',
  EDIT_DEPARTMENT_TASK = 'EDIT_DEPARTMENT_TASK',
  EDIT_ANY_TASK = 'EDIT_ANY_TASK',
  DELETE_OWN_TASK = 'DELETE_OWN_TASK',
  DELETE_TEAM_TASK = 'DELETE_TEAM_TASK',
  DELETE_DEPARTMENT_TASK = 'DELETE_DEPARTMENT_TASK',
  DELETE_ANY_TASK = 'DELETE_ANY_TASK',
  VIEW_OWN_TASKS = 'VIEW_OWN_TASKS',
  VIEW_TEAM_TASKS = 'VIEW_TEAM_TASKS',
  VIEW_DEPARTMENT_TASKS = 'VIEW_DEPARTMENT_TASKS',
  VIEW_ALL_TASKS = 'VIEW_ALL_TASKS',
  ASSIGN_TASK_TO_SELF = 'ASSIGN_TASK_TO_SELF',
  ASSIGN_TASK_TO_TEAM = 'ASSIGN_TASK_TO_TEAM',
  ASSIGN_TASK_TO_DEPARTMENT = 'ASSIGN_TASK_TO_DEPARTMENT',
  ASSIGN_TASK_TO_ANYONE = 'ASSIGN_TASK_TO_ANYONE',
  
  // Turnos
  CREATE_SHIFT = 'CREATE_SHIFT',
  EDIT_OWN_SHIFT = 'EDIT_OWN_SHIFT',
  EDIT_TEAM_SHIFT = 'EDIT_TEAM_SHIFT',
  EDIT_DEPARTMENT_SHIFT = 'EDIT_DEPARTMENT_SHIFT',
  EDIT_ANY_SHIFT = 'EDIT_ANY_SHIFT',
  DELETE_OWN_SHIFT = 'DELETE_OWN_SHIFT',
  DELETE_TEAM_SHIFT = 'DELETE_TEAM_SHIFT',
  DELETE_DEPARTMENT_SHIFT = 'DELETE_DEPARTMENT_SHIFT',
  DELETE_ANY_SHIFT = 'DELETE_ANY_SHIFT',
  VIEW_OWN_SHIFTS = 'VIEW_OWN_SHIFTS',
  VIEW_TEAM_SHIFTS = 'VIEW_TEAM_SHIFTS',
  VIEW_DEPARTMENT_SHIFTS = 'VIEW_DEPARTMENT_SHIFTS',
  VIEW_ALL_SHIFTS = 'VIEW_ALL_SHIFTS',
  
  // Eventos/Calendário
  CREATE_EVENT = 'CREATE_EVENT',
  EDIT_OWN_EVENT = 'EDIT_OWN_EVENT',
  EDIT_ANY_EVENT = 'EDIT_ANY_EVENT',
  DELETE_OWN_EVENT = 'DELETE_OWN_EVENT',
  DELETE_ANY_EVENT = 'DELETE_ANY_EVENT',
  VIEW_OWN_EVENTS = 'VIEW_OWN_EVENTS',
  VIEW_ALL_EVENTS = 'VIEW_ALL_EVENTS',
  
  // Mensagens
  SEND_MESSAGE = 'SEND_MESSAGE',
  READ_MESSAGE = 'READ_MESSAGE',
  DELETE_OWN_MESSAGE = 'DELETE_OWN_MESSAGE',
  
  // Solicitações
  REQUEST_SHIFT_SWAP = 'REQUEST_SHIFT_SWAP',
  REQUEST_TIME_OFF = 'REQUEST_TIME_OFF',
  APPROVE_SHIFT_SWAP = 'APPROVE_SHIFT_SWAP',
  APPROVE_TIME_OFF = 'APPROVE_TIME_OFF',
  VIEW_OWN_REQUESTS = 'VIEW_OWN_REQUESTS',
  VIEW_TEAM_REQUESTS = 'VIEW_TEAM_REQUESTS',
  VIEW_DEPARTMENT_REQUESTS = 'VIEW_DEPARTMENT_REQUESTS',
  VIEW_ALL_REQUESTS = 'VIEW_ALL_REQUESTS',
  
  // Relatórios
  VIEW_OWN_REPORTS = 'VIEW_OWN_REPORTS',
  VIEW_TEAM_REPORTS = 'VIEW_TEAM_REPORTS',
  VIEW_DEPARTMENT_REPORTS = 'VIEW_DEPARTMENT_REPORTS',
  VIEW_ALL_REPORTS = 'VIEW_ALL_REPORTS',
  
  // Configurações
  MANAGE_COMPANY_SETTINGS = 'MANAGE_COMPANY_SETTINGS',
  VIEW_COMPANY_SETTINGS = 'VIEW_COMPANY_SETTINGS',
}

// Definição de permissões por função (Hierarquia Rígida)
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    // Todas as permissões
    Permission.VIEW_ALL_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    Permission.MANAGE_DEPARTMENTS,
    Permission.MANAGE_TEAMS,
    Permission.VIEW_DEPARTMENTS,
    Permission.VIEW_TEAMS,
    Permission.CREATE_TASK,
    Permission.EDIT_ANY_TASK,
    Permission.DELETE_ANY_TASK,
    Permission.VIEW_ALL_TASKS,
    Permission.ASSIGN_TASK_TO_ANYONE,
    Permission.CREATE_SHIFT,
    Permission.EDIT_ANY_SHIFT,
    Permission.DELETE_ANY_SHIFT,
    Permission.VIEW_ALL_SHIFTS,
    Permission.CREATE_EVENT,
    Permission.EDIT_ANY_EVENT,
    Permission.DELETE_ANY_EVENT,
    Permission.VIEW_ALL_EVENTS,
    Permission.SEND_MESSAGE,
    Permission.READ_MESSAGE,
    Permission.DELETE_OWN_MESSAGE,
    Permission.REQUEST_SHIFT_SWAP,
    Permission.REQUEST_TIME_OFF,
    Permission.APPROVE_SHIFT_SWAP,
    Permission.APPROVE_TIME_OFF,
    Permission.VIEW_ALL_REQUESTS,
    Permission.VIEW_ALL_REPORTS,
    Permission.MANAGE_COMPANY_SETTINGS,
    Permission.VIEW_COMPANY_SETTINGS,
  ],
  
  MANAGER: [
    // Gestão do departamento
    Permission.VIEW_DEPARTMENT_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.MANAGE_TEAMS,
    Permission.VIEW_DEPARTMENTS,
    Permission.VIEW_TEAMS,
    Permission.CREATE_TASK,
    Permission.EDIT_DEPARTMENT_TASK,
    Permission.DELETE_DEPARTMENT_TASK,
    Permission.VIEW_DEPARTMENT_TASKS,
    Permission.ASSIGN_TASK_TO_DEPARTMENT,
    Permission.CREATE_SHIFT,
    Permission.EDIT_DEPARTMENT_SHIFT,
    Permission.DELETE_DEPARTMENT_SHIFT,
    Permission.VIEW_DEPARTMENT_SHIFTS,
    Permission.CREATE_EVENT,
    Permission.EDIT_OWN_EVENT,
    Permission.DELETE_OWN_EVENT,
    Permission.VIEW_ALL_EVENTS,
    Permission.SEND_MESSAGE,
    Permission.READ_MESSAGE,
    Permission.DELETE_OWN_MESSAGE,
    Permission.REQUEST_SHIFT_SWAP,
    Permission.REQUEST_TIME_OFF,
    Permission.APPROVE_SHIFT_SWAP,
    Permission.APPROVE_TIME_OFF,
    Permission.VIEW_DEPARTMENT_REQUESTS,
    Permission.VIEW_DEPARTMENT_REPORTS,
    Permission.VIEW_COMPANY_SETTINGS,
  ],
  
  SUPERVISOR: [
    // Gestão da equipe
    Permission.VIEW_TEAM_USERS,
    Permission.VIEW_TEAMS,
    Permission.CREATE_TASK,
    Permission.EDIT_TEAM_TASK,
    Permission.DELETE_TEAM_TASK,
    Permission.VIEW_TEAM_TASKS,
    Permission.ASSIGN_TASK_TO_TEAM,
    Permission.CREATE_SHIFT,
    Permission.EDIT_TEAM_SHIFT,
    Permission.DELETE_TEAM_SHIFT,
    Permission.VIEW_TEAM_SHIFTS,
    Permission.CREATE_EVENT,
    Permission.EDIT_OWN_EVENT,
    Permission.DELETE_OWN_EVENT,
    Permission.VIEW_ALL_EVENTS,
    Permission.SEND_MESSAGE,
    Permission.READ_MESSAGE,
    Permission.DELETE_OWN_MESSAGE,
    Permission.REQUEST_SHIFT_SWAP,
    Permission.REQUEST_TIME_OFF,
    Permission.APPROVE_SHIFT_SWAP,
    Permission.APPROVE_TIME_OFF,
    Permission.VIEW_TEAM_REQUESTS,
    Permission.VIEW_TEAM_REPORTS,
  ],
  
  STAFF: [
    // Apenas operações básicas - SEM criar tarefas/eventos
    Permission.VIEW_TEAM_USERS,       // Ver colegas da equipe
    Permission.VIEW_TEAM_TASKS,       // Ver tarefas da equipe
    Permission.EDIT_OWN_TASK,         // Editar apenas suas próprias tarefas
    Permission.VIEW_OWN_TASKS,        // Ver suas próprias tarefas
    Permission.VIEW_TEAM_SHIFTS,      // Ver turnos da equipe
    Permission.VIEW_OWN_SHIFTS,       // Ver seus próprios turnos
    Permission.VIEW_OWN_EVENTS,       // Ver seus próprios eventos
    Permission.SEND_MESSAGE,          // Enviar mensagens
    Permission.READ_MESSAGE,          // Ler mensagens
    Permission.DELETE_OWN_MESSAGE,    // Deletar suas próprias mensagens
    Permission.REQUEST_SHIFT_SWAP,    // Solicitar troca de turno
    Permission.REQUEST_TIME_OFF,      // Solicitar folga
    Permission.VIEW_OWN_REQUESTS,     // Ver suas próprias solicitações
    Permission.VIEW_OWN_REPORTS,      // Ver seus próprios relatórios
  ],
};

// Função para verificar se o usuário tem uma permissão específica
export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

// Função para verificar múltiplas permissões (OR logic)
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Função para verificar múltiplas permissões (AND logic)
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Função para obter todas as permissões de uma função
export function getRolePermissions(userRole: string): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

// Middleware para validação de permissões em API routes
export function requirePermission(userRole: string, permission: Permission): boolean {
  if (!hasPermission(userRole, permission)) {
    return false;
  }
  return true;
}

// Função auxiliar para verificar se pode visualizar dados de outro usuário
export function canViewUserData(
  viewerRole: string,
  viewerDepartmentId: string,
  viewerTeamId: string,
  targetDepartmentId: string,
  targetTeamId: string
): boolean {
  // ADMIN pode ver tudo
  if (hasPermission(viewerRole, Permission.VIEW_ALL_USERS)) {
    return true;
  }
  
  // MANAGER pode ver seu departamento
  if (hasPermission(viewerRole, Permission.VIEW_DEPARTMENT_USERS)) {
    return viewerDepartmentId === targetDepartmentId;
  }
  
  // SUPERVISOR e STAFF podem ver apenas sua equipe
  if (hasPermission(viewerRole, Permission.VIEW_TEAM_USERS)) {
    return viewerTeamId === targetTeamId;
  }
  
  return false;
}

// Função auxiliar para verificar se pode editar/criar tarefa
export function canManageTask(
  userRole: string,
  userDepartmentId: string,
  userTeamId: string,
  taskUserId?: string,
  taskDepartmentId?: string,
  taskTeamId?: string,
  isCreating: boolean = false
): { canManage: boolean; reason?: string } {
  // STAFF não pode criar tarefas
  if (isCreating && userRole === 'STAFF') {
    return { canManage: false, reason: 'Staff não pode criar tarefas' };
  }
  
  // ADMIN pode tudo
  if (hasPermission(userRole, Permission.EDIT_ANY_TASK)) {
    return { canManage: true };
  }
  
  // MANAGER pode gerenciar tarefas do departamento
  if (hasPermission(userRole, Permission.EDIT_DEPARTMENT_TASK)) {
    if (taskDepartmentId === userDepartmentId) {
      return { canManage: true };
    }
    return { canManage: false, reason: 'Manager só pode gerenciar tarefas do seu departamento' };
  }
  
  // SUPERVISOR pode gerenciar tarefas da equipe
  if (hasPermission(userRole, Permission.EDIT_TEAM_TASK)) {
    if (taskTeamId === userTeamId) {
      return { canManage: true };
    }
    return { canManage: false, reason: 'Supervisor só pode gerenciar tarefas da sua equipe' };
  }
  
  // STAFF pode editar apenas suas próprias tarefas
  if (hasPermission(userRole, Permission.EDIT_OWN_TASK)) {
    if (taskUserId === taskUserId) {
      return { canManage: true };
    }
    return { canManage: false, reason: 'Staff só pode editar suas próprias tarefas' };
  }
  
  return { canManage: false, reason: 'Sem permissão para gerenciar tarefas' };
}

// Função auxiliar para verificar se pode criar evento
export function canCreateEvent(userRole: string): boolean {
  // STAFF não pode criar eventos
  if (userRole === 'STAFF') {
    return false;
  }
  
  return hasPermission(userRole, Permission.CREATE_EVENT);
}

// Função auxiliar para verificar se pode aprovar solicitações
export function canApproveRequests(
  userRole: string,
  userDepartmentId: string,
  userTeamId: string,
  requesterDepartmentId: string,
  requesterTeamId: string
): boolean {
  // ADMIN pode aprovar tudo
  if (hasPermission(userRole, Permission.VIEW_ALL_REQUESTS)) {
    return true;
  }
  
  // MANAGER pode aprovar do seu departamento
  if (hasPermission(userRole, Permission.VIEW_DEPARTMENT_REQUESTS)) {
    return userDepartmentId === requesterDepartmentId;
  }
  
  // SUPERVISOR pode aprovar da sua equipe
  if (hasPermission(userRole, Permission.VIEW_TEAM_REQUESTS)) {
    return userTeamId === requesterTeamId;
  }
  
  return false;
}
