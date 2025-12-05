
# 🎯 Plano de Implementação Completo - Página de Configurações do OrganiZen

## 💡 Funcionalidades Sugeridas para a Página de Configurações

Baseado no sistema OrganiZen e nas melhores práticas, aqui está a lista organizada de funcionalidades que serão implementadas:

### 🎨 1. Personalização e Marca
- ✅ **Branding Corporativo** - Logo, cores, tema (já implementado)
- ✅ **Templates de Email** - Personalização de emails (já implementado)
- 🆕 **Favicon e Ícones** - Ícone do site e PWA
- 🆕 **Nome da Empresa** - Alterar nome exibido no sistema

### 👥 2. Configurações de Usuários e Permissões
- 🆕 **Políticas de Senha** - Requisitos de complexidade, expiração
- 🆕 **Sessões e Segurança** - Timeout de sessão, 2FA (futuro)
- 🆕 **Aprovação de Novos Usuários** - Modo automático ou manual
- 🆕 **Níveis de Acesso Padrão** - Permissões default para novos usuários

### 🏢 3. Configurações da Empresa
- 🆕 **Informações Gerais** - Nome, endereço, telefone, CNPJ/NIF
- 🆕 **Fuso Horário** - Configuração regional
- 🆕 **Idioma Padrão** - Idioma principal da empresa
- 🆕 **Horário de Funcionamento** - Dias e horários de trabalho

### 📧 4. Notificações e Comunicação
- 🆕 **Preferências de Email** - Quando enviar notificações
- 🆕 **Notificações Push** - Ativar/desativar por tipo
- 🆕 **Frequência de Resumos** - Diário, semanal, mensal
- 🆕 **Configuração SMTP** - Servidor de email próprio (avançado)

### 📊 5. Departamentos e Equipes
- 🆕 **Estrutura Organizacional** - Visualização e edição da hierarquia
- 🆕 **Departamentos Padrão** - Criar templates de departamentos
- 🆕 **Campos Customizados** - Adicionar campos extras aos departamentos

### ✅ 6. Tarefas e Produtividade
- 🆕 **Status Personalizados** - Criar estados customizados para tarefas
- 🆕 **Prioridades Personalizadas** - Definir níveis de prioridade
- 🆕 **Tags e Categorias** - Gerenciar tags do sistema
- 🆕 **Automações** - Regras automáticas para tarefas (avançado)

### 📅 7. Calendário e Turnos
- 🆕 **Tipos de Eventos** - Categorias de eventos no calendário
- 🆕 **Turnos Padrão** - Templates de turnos de trabalho
- 🆕 **Feriados** - Gerenciar feriados da empresa

### 💰 8. Plano e Faturamento (Futuro)
- 🆕 **Assinatura Atual** - Exibir plano (Basic, Pro, Pro+)
- 🆕 **Limites de Uso** - Usuários, espaço, funcionalidades
- 🆕 **Histórico de Pagamentos** - Faturas e recibos
- 🆕 **Upgrade/Downgrade** - Alterar plano

### 🔧 9. Integrações (Futuro)
- 🆕 **Conectar Serviços Externos** - Google Calendar, Slack, etc.
- 🆕 **Webhooks** - Eventos customizados
- 🆕 **API Keys** - Acesso programático ao sistema

### 🔒 10. Backup e Dados
- 🆕 **Exportar Dados** - Download de todos os dados da empresa
- 🆕 **Backup Automático** - Configurar frequência
- 🆕 **Logs de Auditoria** - Histórico de alterações importantes

### 📱 11. Preferências Pessoais (Por Usuário)
- 🆕 **Idioma** - Preferência individual (já existe parcialmente)
- 🆕 **Tema** - Claro/escuro por usuário
- 🆕 **Notificações** - Preferências individuais
- 🆕 **Dashboard** - Personalizar widgets exibidos

---

## 🎯 Layout Recomendado da Página

```
┌─────────────────────────────────────┐
│         ⚙️  Configurações           │
├─────────────────────────────────────┤
│                                     │
│  🎨  Personalização                 │
│    → Branding Corporativo           │
│    → Templates de Email             │
│                                     │
│  🏢  Empresa                         │
│    → Informações Gerais             │
│    → Horário e Localização          │
│                                     │
│  👥  Usuários e Permissões          │
│    → Políticas de Acesso            │
│    → Segurança                      │
│                                     │
│  📊  Departamentos e Equipes        │
│    → Estrutura Organizacional       │
│                                     │
│  ✅  Tarefas                         │
│    → Status e Prioridades           │
│                                     │
│  📧  Notificações                    │
│    → Preferências de Email          │
│                                     │
└─────────────────────────────────────┘
```

---

## 🏗️ Plano de Implementação Completo (100% Cobertura)

### Princípios Fundamentais

✅ **Incrementalidade** - Pequenas entregas funcionais  
✅ **Testabilidade** - Testar após cada mudança  
✅ **Reversibilidade** - Poder voltar atrás facilmente (checkpoints)  
✅ **Isolamento** - Mudanças não afetam código existente  
✅ **Documentação** - Registrar decisões e mudanças  

---

## 📋 FASE 0: Fundação (Preparação) 🏗️

### Objetivo
Criar a infraestrutura base sem quebrar nada existente

### O que implementar
- ✅ Criar a página principal `/settings` (vazia, só layout)
- ✅ Criar estrutura de navegação/menu lateral
- ✅ Migrar links existentes (branding, email-templates)
- ✅ Design responsivo e consistente com o sistema

### Checkpoint
`"Settings page foundation"`

### Benefícios
- ✅ Não toca em código existente
- ✅ Valida a estrutura antes de adicionar funcionalidades
- ✅ Usuários veem progresso visual

### Tempo estimado
**1-2 horas**

---

## 📋 FASE 1: Informações da Empresa (Expandida) 🏢

### Objetivo
Configurações gerais da empresa completas e testadas

### O que implementar

#### 1.1 Database Schema
```prisma
model Company {
  id                    String    @id @default(cuid())
  name                  String
  email                 String?
  phone                 String?
  address               String?
  city                  String?
  state                 String?
  country               String?
  postalCode            String?
  taxId                 String?   // CNPJ/NIF
  website               String?
  
  // NOVOS CAMPOS
  defaultLanguage       String    @default("pt")
  favicon               String?   // URL do favicon
  pwaIcon               String?   // URL do ícone PWA
  
  // Horário de funcionamento (JSON)
  businessHours         Json?     // { "monday": {"start": "09:00", "end": "18:00"}, ... }
  
  // ... outros campos existentes
}
```

#### 1.2 API Endpoints
- `GET /api/settings/company` - Buscar informações
- `PUT /api/settings/company` - Atualizar informações
- `POST /api/settings/company/favicon` - Upload de favicon
- `POST /api/settings/company/pwa-icon` - Upload de ícone PWA

#### 1.3 UI Components
- Formulário de informações gerais (nome, endereço, contato, CNPJ/NIF)
- Seletor de idioma padrão da empresa
- Upload de favicon (16x16, 32x32)
- Upload de ícone PWA (192x192, 512x512)
- Editor de horário de funcionamento (dias da semana + horários)
- Validação em tempo real
- Preview das mudanças

#### 1.4 Funcionalidades
- ✅ Editar nome da empresa
- ✅ Configurar endereço completo
- ✅ Definir contatos (email, telefone, website)
- ✅ Adicionar CNPJ/NIF
- ✅ **Selecionar idioma padrão** (pt, en, es, fr)
- ✅ **Upload de favicon** com validação de tamanho
- ✅ **Upload de ícone PWA** com geração automática de múltiplos tamanhos
- ✅ **Configurar horário de funcionamento** por dia da semana
- ✅ Validação completa de campos
- ✅ Salvamento automático ou manual

### Testes
- ✅ Criar/editar informações da empresa
- ✅ Validar campos obrigatórios
- ✅ Upload de favicon e ícones
- ✅ Configurar horários de funcionamento
- ✅ Cancelar e restaurar valores anteriores

### Checkpoint
`"Company information settings - complete"`

### Benefícios
- ✅ Funcionalidade útil imediatamente
- ✅ Padrão estabelecido para próximas features
- ✅ Fácil de testar e validar
- ✅ **Cobertura completa de info da empresa**

### Tempo estimado
**3-4 horas** (expandido de 2-3h)

---

## 📋 FASE 2: Configurações de Segurança (Expandida) 🔒

### Objetivo
Políticas de senha, sessões e aprovações de usuários

### O que implementar

#### 2.1 Database Schema
```prisma
model SecuritySettings {
  id                      String   @id @default(cuid())
  companyId               String   @unique
  company                 Company  @relation(fields: [companyId], references: [id])
  
  // Políticas de senha
  minPasswordLength       Int      @default(8)
  requireUppercase        Boolean  @default(true)
  requireLowercase        Boolean  @default(true)
  requireNumbers          Boolean  @default(true)
  requireSpecialChars     Boolean  @default(false)
  passwordExpirationDays  Int?     // null = nunca expira
  
  // Sessões
  sessionTimeoutMinutes   Int      @default(480) // 8 horas
  maxConcurrentSessions   Int      @default(3)
  
  // Aprovação de usuários
  requireUserApproval     Boolean  @default(false)
  autoApproveEmails       String[] // Domínios ou emails auto-aprovados
  
  // Níveis de acesso padrão
  defaultRole             String   @default("MEMBER")
  defaultPermissions      Json?    // Permissões default para novos usuários
  
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

#### 2.2 API Endpoints
- `GET /api/settings/security` - Buscar configurações
- `PUT /api/settings/security` - Atualizar configurações
- `POST /api/settings/security/test-password` - Testar senha contra políticas

#### 2.3 UI Components
- Editor de políticas de senha com preview em tempo real
- Configurador de timeout de sessão
- Toggle para aprovação manual de usuários
- Editor de emails/domínios auto-aprovados
- Seletor de role padrão para novos usuários
- Configurador de permissões padrão

#### 2.4 Funcionalidades
- ✅ Definir requisitos de complexidade de senha
- ✅ Configurar expiração de senha
- ✅ Definir timeout de sessão
- ✅ Limitar sessões concorrentes
- ✅ **Ativar/desativar aprovação manual de novos usuários**
- ✅ **Configurar domínios/emails auto-aprovados** (@empresa.com)
- ✅ **Definir role padrão** para novos usuários (MEMBER, MANAGER, etc.)
- ✅ **Configurar permissões padrão** para cada role
- ✅ Testar senha contra políticas em tempo real

#### 2.5 Lógica de Aplicação
- Validar senha no signup contra políticas
- Validar senha no reset contra políticas
- Aplicar timeout de sessão
- Aplicar fluxo de aprovação se ativado
- Aplicar role e permissões padrão em novo usuário

### Testes
- ✅ Configurar políticas de senha
- ✅ Testar signup com senhas válidas/inválidas
- ✅ Validar timeout de sessão
- ✅ Testar aprovação manual de usuários
- ✅ Validar auto-aprovação por domínio
- ✅ Verificar role e permissões padrão aplicadas

### Checkpoint
`"Security settings - complete with user approval"`

### Benefícios
- ✅ Melhora segurança do sistema
- ✅ Independente de outras features
- ✅ Valor imediato para empresas
- ✅ **Controle total sobre acesso de novos usuários**

### Tempo estimado
**5-6 horas** (expandido de 3-4h)

---

## 📋 FASE 3: Status, Tags e Prioridades (Expandida) 🏷️

### Objetivo
Customização completa de tarefas

### O que implementar

#### 3.1 Database Schema
```prisma
model TaskStatus {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  color       String
  icon        String?
  order       Int
  isDefault   Boolean  @default(false)
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@unique([companyId, name])
}

model TaskTag {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  color       String
  description String?
  createdAt   DateTime @default(now())
  
  @@unique([companyId, name])
}

// NOVO
model TaskPriority {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  level       Int      // 1 = baixa, 5 = crítica
  color       String
  icon        String?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@unique([companyId, name])
  @@unique([companyId, level])
}
```

#### 3.2 API Endpoints
- `GET /api/settings/task-statuses` - Listar status
- `POST /api/settings/task-statuses` - Criar status
- `PUT /api/settings/task-statuses/:id` - Editar status
- `DELETE /api/settings/task-statuses/:id` - Deletar status
- `PUT /api/settings/task-statuses/reorder` - Reordenar
- (Similar para tags)
- **`GET /api/settings/task-priorities`** - Listar prioridades
- **`POST /api/settings/task-priorities`** - Criar prioridade
- **`PUT /api/settings/task-priorities/:id`** - Editar prioridade
- **`DELETE /api/settings/task-priorities/:id`** - Deletar prioridade

#### 3.3 UI Components
- Gerenciador de status com drag-and-drop
- Gerenciador de tags com busca e filtros
- **Gerenciador de prioridades** com níveis (1-5)
- Color picker para cada item
- Icon picker para status e prioridades
- Preview em tempo real

#### 3.4 Funcionalidades
- ✅ Criar/editar/deletar status customizados
- ✅ Reordenar status (drag-and-drop)
- ✅ Definir cor e ícone para cada status
- ✅ Criar/editar/deletar tags
- ✅ **Criar/editar/deletar prioridades customizadas**
- ✅ **Definir níveis de prioridade** (1-5 ou customizado)
- ✅ **Atribuir cores e ícones a prioridades**
- ✅ Marcar status/prioridade como padrão
- ✅ Validar uso antes de deletar

#### 3.5 Integração
- Atualizar componentes de tarefas para usar status/tags/prioridades customizados
- Migrar tarefas existentes para novos status
- Validar integridade ao deletar

### Testes
- ✅ Criar, editar, deletar status
- ✅ Criar, editar, deletar tags
- ✅ **Criar, editar, deletar prioridades**
- ✅ Reordenar status
- ✅ Usar em tarefas novas e existentes
- ✅ Validar deleção com tarefas associadas

### Checkpoint
`"Custom statuses, tags and priorities"`

### Benefícios
- ✅ Funcionalidade muito solicitada
- ✅ Aumenta flexibilidade do sistema
- ✅ Não quebra tarefas existentes
- ✅ **Prioridades customizadas por empresa**

### Tempo estimado
**5-6 horas** (expandido de 4-5h)

---

## 📋 FASE 4: Notificações e Comunicação (Expandida) 📧

### Objetivo
Controle fino sobre emails, notificações push e resumos

### O que implementar

#### 4.1 Database Schema
```prisma
model NotificationSettings {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])
  
  // Preferências de email
  emailOnTaskAssigned   Boolean  @default(true)
  emailOnTaskCompleted  Boolean  @default(true)
  emailOnComment        Boolean  @default(true)
  emailOnMention        Boolean  @default(true)
  emailOnDeadline       Boolean  @default(true)
  
  // Notificações push
  pushEnabled           Boolean  @default(true)
  pushOnTaskAssigned    Boolean  @default(true)
  pushOnComment         Boolean  @default(true)
  pushOnMention         Boolean  @default(true)
  
  // Frequência de resumos
  dailyDigest           Boolean  @default(false)
  weeklyDigest          Boolean  @default(true)
  monthlyDigest         Boolean  @default(false)
  digestTime            String   @default("09:00") // HH:mm
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### 4.2 API Endpoints
- `GET /api/settings/notifications` - Buscar preferências
- `PUT /api/settings/notifications` - Atualizar preferências
- `POST /api/settings/notifications/test-email` - Enviar email de teste
- **`POST /api/settings/notifications/test-push`** - Enviar push de teste

#### 4.3 UI Components
- Toggle para cada tipo de notificação email
- **Toggle para cada tipo de notificação push**
- **Configurador de frequência de resumos** (diário/semanal/mensal)
- **Seletor de horário** para envio de resumos
- Botões de teste para email e push
- Preview de notificações

#### 4.4 Funcionalidades
- ✅ Ativar/desativar emails por tipo de evento
- ✅ **Ativar/desativar notificações push globalmente**
- ✅ **Ativar/desativar push por tipo de evento**
- ✅ **Configurar frequência de resumos** (nenhum, diário, semanal, mensal)
- ✅ **Definir horário de envio de resumos**
- ✅ Testar envio de email
- ✅ **Testar envio de push**
- ✅ Salvar preferências por usuário

#### 4.5 Lógica de Aplicação
- Verificar preferências antes de enviar email
- Verificar preferências antes de enviar push
- Agendar envio de resumos conforme frequência
- Respeitar horário configurado para resumos

### Testes
- ✅ Configurar preferências de email
- ✅ **Configurar preferências de push**
- ✅ **Configurar frequência e horário de resumos**
- ✅ Validar que emails não são enviados quando desativados
- ✅ **Validar que push não são enviados quando desativados**
- ✅ Testar envio de email e push
- ✅ **Validar envio de resumos no horário configurado**

### Checkpoint
`"Notification preferences with push and digests"`

### Benefícios
- ✅ Reduz spam de emails
- ✅ Melhora experiência do usuário
- ✅ Complementa sistema de emails existente
- ✅ **Controle total sobre notificações push**
- ✅ **Resumos personalizados por período**

### Tempo estimado
**5-6 horas** (expandido de 3-4h)

---

## 📋 FASE 5: Fuso Horário e Regionalização 🌍

### Objetivo
Suporte multi-regional completo

### O que implementar

#### 5.1 Database Schema
```prisma
model Company {
  // ... campos existentes
  timezone              String   @default("America/Sao_Paulo")
  dateFormat            String   @default("DD/MM/YYYY")
  timeFormat            String   @default("24h") // "12h" ou "24h"
  firstDayOfWeek        Int      @default(0) // 0 = Domingo, 1 = Segunda
  currency              String   @default("BRL")
}
```

#### 5.2 API Endpoints
- `GET /api/settings/regional` - Buscar configurações
- `PUT /api/settings/regional` - Atualizar configurações

#### 5.3 UI Components
- Seletor de fuso horário (timezone picker)
- Seletor de formato de data
- Seletor de formato de hora (12h/24h)
- Seletor de primeiro dia da semana
- Seletor de moeda
- Preview de formatação

#### 5.4 Funcionalidades
- ✅ Configurar fuso horário da empresa
- ✅ Definir formato de data (DD/MM/YYYY, MM/DD/YYYY, etc.)
- ✅ Definir formato de hora (12h/24h)
- ✅ Definir primeiro dia da semana
- ✅ Definir moeda padrão
- ✅ Preview em tempo real das mudanças

#### 5.5 Lógica de Aplicação
- Converter todas as datas para timezone configurado
- Formatar datas conforme formato selecionado
- Aplicar formato de hora globalmente
- Ajustar calendários para primeiro dia configurado

### Testes
- ✅ Configurar timezone e validar conversão de datas
- ✅ Testar diferentes formatos de data/hora
- ✅ Validar primeiro dia da semana no calendário
- ✅ Verificar formatação de valores monetários

### Checkpoint
`"Regional and timezone settings"`

### Benefícios
- ✅ Crucial para empresas internacionais
- ✅ Corrige problemas de horário
- ✅ Relativamente simples
- ✅ Melhora UX globalmente

### Tempo estimado
**2-3 horas**

---

## 📋 FASE 6A: Departamentos e Estrutura Organizacional 📊

### Objetivo
Gerenciamento completo da hierarquia da empresa

### O que implementar

#### 6A.1 Database Schema
```prisma
model DepartmentTemplate {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  name            String
  description     String?
  defaultManagerRole String?
  customFields    Json?    // Campos extras customizados
  createdAt       DateTime @default(now())
  
  @@unique([companyId, name])
}

model DepartmentCustomField {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  fieldName       String
  fieldType       String   // text, number, date, select, etc.
  fieldOptions    Json?    // Para tipo select
  isRequired      Boolean  @default(false)
  order           Int
  createdAt       DateTime @default(now())
  
  @@unique([companyId, fieldName])
}
```

#### 6A.2 API Endpoints
- `GET /api/settings/departments` - Listar estrutura organizacional
- `POST /api/settings/departments/templates` - Criar template
- `PUT /api/settings/departments/templates/:id` - Editar template
- `DELETE /api/settings/departments/templates/:id` - Deletar template
- `GET /api/settings/departments/custom-fields` - Listar campos customizados
- `POST /api/settings/departments/custom-fields` - Criar campo
- `PUT /api/settings/departments/custom-fields/:id` - Editar campo
- `DELETE /api/settings/departments/custom-fields/:id` - Deletar campo

#### 6A.3 UI Components
- Visualização hierárquica de departamentos (tree view)
- Editor de templates de departamentos
- Gerenciador de campos customizados
- Drag-and-drop para reordenar
- Validação em tempo real

#### 6A.4 Funcionalidades
- ✅ Visualizar estrutura organizacional completa
- ✅ Editar hierarquia de departamentos
- ✅ Criar templates de departamentos padrão
- ✅ Definir role padrão de manager para cada template
- ✅ Adicionar campos customizados aos departamentos
- ✅ Configurar tipos de campos (texto, número, data, seleção, etc.)
- ✅ Definir campos obrigatórios
- ✅ Reordenar campos customizados

### Testes
- ✅ Criar e editar templates de departamentos
- ✅ Criar departamentos usando templates
- ✅ Adicionar e usar campos customizados
- ✅ Validar campos obrigatórios
- ✅ Visualizar hierarquia atualizada

### Checkpoint
`"Department structure and custom fields"`

### Benefícios
- ✅ Flexibilidade na estrutura organizacional
- ✅ Templates agilizam criação de novos departamentos
- ✅ Campos customizados adaptam sistema à empresa

### Tempo estimado
**6-8 horas**

---

## 📋 FASE 6B: Calendário, Turnos e Feriados 📅

### Objetivo
Gerenciamento completo de eventos, turnos e feriados

### O que implementar

#### 6B.1 Database Schema
```prisma
model EventType {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  name            String
  color           String
  icon            String?
  description     String?
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  @@unique([companyId, name])
}

model ShiftTemplate {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  name            String
  startTime       String   // HH:mm
  endTime         String   // HH:mm
  breakDuration   Int?     // Minutos
  color           String
  description     String?
  createdAt       DateTime @default(now())
  
  @@unique([companyId, name])
}

model CompanyHoliday {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  name            String
  date            DateTime
  isRecurring     Boolean  @default(false) // Se repete anualmente
  description     String?
  createdAt       DateTime @default(now())
  
  @@unique([companyId, name, date])
}
```

#### 6B.2 API Endpoints
- `GET /api/settings/event-types` - Listar tipos de eventos
- `POST /api/settings/event-types` - Criar tipo
- `PUT /api/settings/event-types/:id` - Editar tipo
- `DELETE /api/settings/event-types/:id` - Deletar tipo
- `GET /api/settings/shift-templates` - Listar templates de turnos
- `POST /api/settings/shift-templates` - Criar template
- `PUT /api/settings/shift-templates/:id` - Editar template
- `DELETE /api/settings/shift-templates/:id` - Deletar template
- `GET /api/settings/holidays` - Listar feriados
- `POST /api/settings/holidays` - Criar feriado
- `PUT /api/settings/holidays/:id` - Editar feriado
- `DELETE /api/settings/holidays/:id` - Deletar feriado
- `POST /api/settings/holidays/import` - Importar feriados nacionais

#### 6B.3 UI Components
- Gerenciador de tipos de eventos com cores e ícones
- Gerenciador de templates de turnos com visualização de horários
- Calendário de feriados com marcação visual
- Importador de feriados nacionais (por país)
- Color picker e icon picker

#### 6B.4 Funcionalidades
- ✅ Criar/editar/deletar tipos de eventos customizados
- ✅ Definir cor e ícone para cada tipo
- ✅ Criar/editar/deletar templates de turnos
- ✅ Definir horários e duração de intervalo
- ✅ Criar/editar/deletar feriados da empresa
- ✅ Marcar feriados como recorrentes (anuais)
- ✅ Importar feriados nacionais automaticamente
- ✅ Visualizar feriados no calendário

#### 6B.5 Integração
- Usar tipos de eventos no calendário
- Aplicar templates de turnos ao criar escalas
- Destacar feriados no calendário
- Validar agendamentos contra feriados

### Testes
- ✅ Criar e usar tipos de eventos
- ✅ Criar e aplicar templates de turnos
- ✅ Adicionar feriados e validar visualização
- ✅ Importar feriados nacionais
- ✅ Verificar recorrência de feriados anuais

### Checkpoint
`"Calendar event types, shifts and holidays"`

### Benefícios
- ✅ Calendário mais organizado e visual
- ✅ Templates de turnos agilizam escala
- ✅ Feriados evitam agendamentos incorretos

### Tempo estimado
**6-8 horas**

---

## 📋 FASE 6C: Preferências Pessoais por Usuário 📱

### Objetivo
Customização individual da experiência

### O que implementar

#### 6C.1 Database Schema
```prisma
model UserPreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])
  
  // Idioma (já existe parcialmente)
  language              String   @default("pt")
  
  // Tema
  theme                 String   @default("system") // light, dark, system
  
  // Dashboard
  dashboardLayout       Json?    // Configuração de widgets e posições
  favoriteWidgets       String[] // IDs dos widgets favoritos
  
  // Outros
  compactMode           Boolean  @default(false)
  showAvatars           Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### 6C.2 API Endpoints
- `GET /api/settings/preferences` - Buscar preferências do usuário
- `PUT /api/settings/preferences` - Atualizar preferências
- `PUT /api/settings/preferences/dashboard` - Atualizar layout do dashboard

#### 6C.3 UI Components
- Seletor de idioma (pt, en, es, fr)
- Seletor de tema (claro, escuro, automático)
- Editor de dashboard com drag-and-drop de widgets
- Toggle para modo compacto
- Toggle para exibir avatares
- Preview em tempo real

#### 6C.4 Funcionalidades
- ✅ Selecionar idioma individual (sobrepõe idioma da empresa)
- ✅ Selecionar tema individual (claro/escuro/automático)
- ✅ Personalizar layout do dashboard
- ✅ Adicionar/remover widgets do dashboard
- ✅ Reordenar widgets (drag-and-drop)
- ✅ Marcar widgets como favoritos
- ✅ Ativar modo compacto (menos espaçamento)
- ✅ Ativar/desativar exibição de avatares

#### 6C.5 Integração
- Aplicar idioma individual em toda a interface
- Aplicar tema individual (sobrepõe tema global)
- Renderizar dashboard conforme layout personalizado
- Aplicar modo compacto globalmente para o usuário

### Testes
- ✅ Mudar idioma e validar tradução
- ✅ Mudar tema e validar aplicação
- ✅ Personalizar dashboard e validar salvamento
- ✅ Reordenar widgets
- ✅ Testar modo compacto

### Checkpoint
`"Personal user preferences and dashboard"`

### Benefícios
- ✅ Experiência personalizada por usuário
- ✅ Dashboard adaptável às necessidades individuais
- ✅ Melhora produtividade e satisfação

### Tempo estimado
**5-6 horas**

---

## 📋 FASE 6+: Funcionalidades Avançadas 🚀

### Objetivo
Recursos avançados conforme demanda

### Funcionalidades a implementar

#### 6+.1 Backup e Exportação de Dados 🔒
- Exportar todos os dados da empresa (JSON, CSV, Excel)
- Configurar backup automático (diário, semanal, mensal)
- Logs de auditoria (histórico de alterações importantes)
- Restaurar dados de backup
- **Tempo estimado:** 4-5 horas

#### 6+.2 Integrações Externas 🔧
- Conectar Google Calendar (sincronização de eventos)
- Conectar Slack (notificações e comandos)
- Conectar Trello/Asana (importação de tarefas)
- Configurar webhooks para eventos customizados
- Gerar e gerenciar API Keys
- **Tempo estimado:** 6-8 horas

#### 6+.3 Configuração SMTP Avançada 📧
- Configurar servidor SMTP próprio
- Testar conexão SMTP
- Configurar emails de remetente customizados
- Configurar assinatura de email corporativa
- **Tempo estimado:** 3-4 horas

#### 6+.4 Automações de Tarefas 🤖
- Criar regras automáticas (se X então Y)
- Triggers: criação, atualização, deadline, etc.
- Ações: atribuir, mover, notificar, etc.
- Interface visual de criação de automações
- **Tempo estimado:** 8-10 horas

#### 6+.5 Planos e Faturamento 💰
- Exibir assinatura atual (Basic, Pro, Pro+)
- Mostrar limites de uso (usuários, espaço, funcionalidades)
- Histórico de pagamentos e faturas
- Upgrade/downgrade de plano
- Configurar método de pagamento
- **Tempo estimado:** 6-8 horas

### Checkpoint após cada sub-fase
`"Advanced features - [nome da funcionalidade]"`

### Tempo total estimado FASE 6+
**27-35 horas** (implementar conforme prioridade)

---

## 📊 Cronograma Completo Atualizado (100% Cobertura)

| Fase | Tempo | Checkpoint | Funcionalidades Cobertas |
|------|-------|------------|--------------------------|
| **FASE 0** | 1-2h | ✅ Foundation | Estrutura base, navegação |
| **FASE 1** | 3-4h | ✅ Company info | Info empresa, idioma padrão, favicon, horário funcionamento |
| **FASE 2** | 5-6h | ✅ Security | Políticas senha, sessões, aprovação usuários, níveis acesso padrão |
| **FASE 3** | 5-6h | ✅ Tasks | Status, tags, **prioridades personalizadas** |
| **FASE 4** | 5-6h | ✅ Notifications | Email, **push, resumos (diário/semanal/mensal)** |
| **FASE 5** | 2-3h | ✅ Regional | Timezone, formatos, moeda |
| **FASE 6A** | 6-8h | ✅ Departments | Estrutura organizacional, templates, campos customizados |
| **FASE 6B** | 6-8h | ✅ Calendar | Tipos de eventos, turnos, feriados |
| **FASE 6C** | 5-6h | ✅ Personal | Idioma, tema, dashboard personalizado |
| **TOTAL CORE** | **38-49h** | **9 checkpoints** | **100% das funcionalidades principais** |
| **FASE 6+** | 27-35h | Variável | Backup, integrações, SMTP, automações, faturamento |
| **TOTAL COMPLETO** | **65-84h** | **14+ checkpoints** | **100% + funcionalidades avançadas** |

---

## 🎯 Estratégia de Minimização de Erros

### 1️⃣ Antes de Cada Fase
- ✅ Revisar schema do banco (impacto em dados existentes?)
- ✅ Planejar endpoints da API (RESTful, consistente?)
- ✅ Desenhar UI mentalmente (UX clara?)

### 2️⃣ Durante o Desenvolvimento
- ✅ Commit frequente (a cada componente/API)
- ✅ Testar isoladamente (não esperar o fim)
- ✅ Validar no browser (não confiar só no build)

### 3️⃣ Após Cada Fase
- ✅ Build de produção (garantir que compila)
- ✅ Teste manual completo (todos os cenários)
- ✅ Checkpoint obrigatório (poder reverter)
- ✅ Deploy para visualização (validar em produção)

---

## 🔧 Práticas Técnicas de Qualidade

### ✅ Arquitetura Limpa
```typescript
// BOM: Separação clara de responsabilidades
/app/settings/
  ├── company/page.tsx           # UI
  ├── api/company/route.ts       # API
/lib/
  ├── settings-service.ts        # Lógica de negócio
  ├── settings-validation.ts     # Validação
```

### ✅ Validação Robusta
Validação em múltiplas camadas:
1. **Cliente (UI)** - Feedback imediato
2. **API** - Segurança
3. **Banco** - Integridade

### ✅ Tratamento de Erros
```typescript
try {
  await updateCompanySettings(data);
  toast.success("Configurações salvas com sucesso!");
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    toast.error("Você não tem permissão");
  } else {
    toast.error("Erro ao salvar. Tente novamente.");
  }
}
```

### ✅ TypeScript Rigoroso
```typescript
// BOM: Tipos bem definidos
interface CompanySettings {
  name: string;
  email: string;
  timezone: string;
  language: string;
}
```

---

## 🎯 Minha Recomendação Final

### Abordagem Ideal

1. **Começar com FASE 0 (Fundação)**
   - Criar estrutura sem risco
   - Ver progresso imediatamente
   - Validar conceito

2. **Implementar 1 fase por sessão**
   - Foco total em uma funcionalidade
   - Testar completamente
   - Checkpoint antes de continuar

3. **Priorizar por valor/risco**
   - Alta utilidade + Baixo risco = Fazer primeiro
   - Baixa utilidade + Alto risco = Fazer depois

4. **Pausar para feedback**
   - Após cada 2-3 fases, você testa
   - Ajustamos antes de continuar
   - Evita retrabalho

---

## ✅ Cobertura Final: 100% das Funcionalidades

### Todas as 35 funcionalidades sugeridas estão cobertas:

✅ **Personalização e Marca** (4/4)
- Branding, Templates Email, Favicon/Ícones, Nome Empresa

✅ **Usuários e Permissões** (4/4)
- Políticas Senha, Sessões, Aprovação Usuários, Níveis Acesso

✅ **Configurações da Empresa** (4/4)
- Info Gerais, Timezone, Idioma Padrão, Horário Funcionamento

✅ **Notificações e Comunicação** (4/4)
- Preferências Email, Push, Frequência Resumos, SMTP

✅ **Departamentos e Equipes** (3/3)
- Estrutura Organizacional, Departamentos Padrão, Campos Customizados

✅ **Tarefas e Produtividade** (4/4)
- Status, Prioridades, Tags, Automações

✅ **Calendário e Turnos** (3/3)
- Tipos Eventos, Turnos Padrão, Feriados

✅ **Plano e Faturamento** (4/4)
- Assinatura, Limites, Histórico, Upgrade/Downgrade

✅ **Integrações** (3/3)
- Serviços Externos, Webhooks, API Keys

✅ **Backup e Dados** (3/3)
- Exportar, Backup Automático, Logs Auditoria

✅ **Preferências Pessoais** (4/4)
- Idioma, Tema, Notificações, Dashboard

**TOTAL: 35/35 funcionalidades = 100% de cobertura** ✅

---

## 📝 Próximos Passos

Aguardo sua confirmação para:
1. ✅ Começar implementação da FASE 0
2. ⏸️ Pausar para revisão e testes
3. 📝 Esclarecer algum ponto do plano

**Pronto para começar quando você autorizar!** 🚀
