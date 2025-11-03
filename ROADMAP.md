
# 🗺️ OrganiZen - Roadmap de Desenvolvimento

**Projeto:** OrganiZen - Sistema de Gestão Hierárquica  
**Localização:** Cabo Verde, Ilha do Sal 🇨🇻  
**Desenvolvedor:** Bruno  
**Última Atualização:** 15 de Outubro de 2025

---

## ✅ Funcionalidades Implementadas (Até Agora)

### **Sistema Base**
- ✅ Autenticação de usuários (NextAuth)
- ✅ Gestão hierárquica (4 níveis: Admin, Gerente, Supervisor, Staff)
- ✅ Dashboard com estatísticas em tempo real
- ✅ Sistema de tarefas completo
- ✅ Sistema de turnos/shifts
- ✅ Calendário de eventos
- ✅ Sistema de mensagens (caixa de entrada/enviados)
- ✅ Chat em tempo real
- ✅ Notificações clicáveis com redirecionamento
- ✅ Gestão de departamentos
- ✅ Gestão de usuários
- ✅ Relatórios e analytics
- ✅ Internacionalização (Português/Inglês)
- ✅ Auto-atualização do dashboard (5 segundos)
- ✅ Quick action buttons funcionais
- ✅ Logo clicável
- ✅ Sistema de anexos/uploads

### **Infraestrutura**
- ✅ Banco de dados PostgreSQL
- ✅ Armazenamento S3 (AWS)
- ✅ Deploy automatizado
- ✅ URL de produção: https://organizen-qlum60.abacusai.app

### **Credenciais de Teste**
- **Email:** maria@teste.com (ou qualquer usuário cadastrado)
- **Senha:** teste123

---

## 🚀 Funcionalidades Planejadas (Futuro)

### **1. 📱 PWA (Progressive Web App)**

**O que é:**
Transformar o OrganiZen em aplicativo instalável em celulares, tablets e computadores.

**Benefícios:**
- Instalável na tela inicial (Android, iOS, Windows, Mac)
- Funciona offline (com cache)
- Abre em tela cheia (sem barra do navegador)
- Ícone próprio na lista de apps
- Notificações push
- Carregamento instantâneo

**Quando Implementar:**
- Opção A: Agora (com URL atual)
- Opção B: Após adquirir domínio próprio (mais profissional)

**Complexidade:** Média  
**Tempo Estimado:** 2-3 horas de desenvolvimento

**Notas:**
- Todas as funcionalidades atuais continuam funcionando
- É possível publicar na Play Store usando TWA (Trusted Web Activity)
- Servidor ainda é necessário (não elimina backend)
- Atualizações automáticas via Service Worker

---

### **2. 🌐 Domínio Próprio**

**Situação Atual:**
- URL temporária: `organizen-qlum60.abacusai.app`

**Objetivo:**
Ter um domínio profissional próprio (ex: `organizen.cv` ou `app.organizen.com`)

**Sugestões de Domínios:**
- `organizen.cv` (Cabo Verde)
- `organizen.app` (Aplicativo)
- `organizen.com` (Internacional)
- `app.organizen.com` (Subdomínio)

**Onde Comprar:**
- **Domínio .cv:** DNS.CV (registrador oficial de Cabo Verde) - https://dns.cv
- **Domínio .app/.com:** Namecheap (https://namecheap.com)
- **Domínio .com:** GoDaddy (https://godaddy.com)

**Custos Estimados:**
- .cv: ~$25-50/ano
- .app: ~$15-20/ano
- .com: ~$12-15/ano

**Processo:**
1. Comprar domínio
2. Configurar DNS (apontar para Abacus.AI)
3. Fazer deploy com domínio personalizado
4. Aguardar propagação (24-48h)

**Documentação:**
https://abacus.ai/help/howTo/chatllm/app_deployment_and_custom_domain_how_to

**Status:** ⏳ Aguardando aquisição do domínio

---

### **3. 💳 Sistema de Subscrição (Pagamentos Recorrentes)**

**Objetivo:**
Empresas pagam mensalmente ou anualmente para usar o OrganiZen.

**Localização do Negócio:**
- 🇨🇻 **Cabo Verde, Ilha do Sal**
- Implica limitações em certos provedores de pagamento

#### **3.1 Provedores de Pagamento Avaliados**

##### **Opção A: Stripe Atlas** ⭐⭐⭐⭐⭐ (RECOMENDADA)
**Status:** Stripe não suporta Cabo Verde diretamente

**Solução:**
- Criar empresa LLC nos EUA via Stripe Atlas
- Custo: $500 (taxa única)
- Permite acesso total ao Stripe
- Empresa americana, mas operação em Cabo Verde

**Vantagens:**
- Melhor tecnologia do mercado
- Subscrições automáticas robustas
- Aceita pagamentos globalmente
- Taxas baixas: 2.9% + $0.30
- Suporte a Pix, cartões, ACH
- Dashboard completo

**Desvantagens:**
- Investimento inicial de $500
- Obrigações fiscais nos EUA (imposto anual)
- Mais burocracia

**Link:** https://stripe.com/atlas

---

##### **Opção B: Paddle** ⭐⭐⭐⭐ (MAIS SIMPLES)
**Status:** ✅ Funciona em Cabo Verde diretamente

**Características:**
- Plataforma focada em SaaS
- "Merchant of Record" (vendem em seu nome)
- Eles cuidam de todos os impostos e compliance
- Você só recebe o dinheiro limpo

**Vantagens:**
- Zero burocracia
- Funciona em qualquer país
- Não precisa se preocupar com impostos
- Suporta múltiplas moedas
- Setup imediato

**Desvantagens:**
- Taxas mais altas: ~5% + taxas de processamento (total ~8%)
- Menos controle direto sobre clientes
- Menos customização

**Link:** https://paddle.com

---

##### **Opção C: PayPal Business** ⭐⭐⭐⭐ (MEIO TERMO)
**Status:** ✅ Funciona em Cabo Verde

**Características:**
- PayPal aceita Cabo Verde como país do vendedor
- Subscrições recorrentes suportadas
- Interface conhecida pelos clientes

**Vantagens:**
- Aceita clientes de Cabo Verde
- Setup relativamente simples
- Suporte a subscrições
- Saque em USD/EUR

**Desvantagens:**
- Taxas: ~4.4% + taxa fixa
- Interface menos moderna
- Suporte ao cliente inferior ao Stripe

**Link:** https://paypal.com/business

---

##### **Opção D: Paystack** ⭐⭐⭐ (AFRICANO)
**Status:** ⚠️ Pode não suportar Cabo Verde

**Características:**
- Gateway africano (adquirido pela Stripe)
- Foco em Nigéria, Gana, África do Sul, Quênia

**Nota:** Verificar se Cabo Verde está na lista de países suportados

**Link:** https://paystack.com

---

##### **Opção E: Wise + Outro Provedor** ⭐⭐⭐
**Características:**
- Usar Wise Business para receber em múltiplas moedas
- Combinar com PayPal ou Paddle
- Transferir para Wise → Sacar em CVE

**Vantagens:**
- Taxas de câmbio muito baixas
- Flexibilidade

---

#### **3.2 Estrutura de Planos Sugerida**

| Plano | Usuários | Preço Mensal | Preço Anual | Economia Anual |
|-------|----------|--------------|-------------|----------------|
| **Basic** | Até 10 | $19/mês | $190/ano | 2 meses grátis |
| **Pro** | Até 50 | $49/mês | $490/ano | 2 meses grátis |
| **Enterprise** | Ilimitado | $99/mês | $990/ano | 2 meses grátis |

**Nota:** Preços em USD (mais universal para clientes internacionais)

**Alternativa para Cabo Verde:**
| Plano | Usuários | Preço Mensal (CVE) | Preço Anual (CVE) |
|-------|----------|---------------------|-------------------|
| **Basic** | Até 10 | 2.000 CVE/mês | 20.000 CVE/ano |
| **Pro** | Até 50 | 5.000 CVE/mês | 50.000 CVE/ano |
| **Enterprise** | Ilimitado | 10.000 CVE/mês | 100.000 CVE/ano |

---

#### **3.3 Decisões Pendentes**

Para implementar o sistema de subscrição, precisamos definir:

**1. Provedor de Pagamento:**
- [ ] Stripe Atlas ($500, melhor tecnologia)
- [ ] Paddle (zero custo inicial, mais simples)
- [ ] PayPal (meio termo)
- [ ] Outro

**2. Público-Alvo Principal:**
- [ ] Empresas em Cabo Verde
- [ ] Empresas no Brasil
- [ ] Empresas na Europa/EUA
- [ ] Mix internacional

**3. Moeda de Cobrança:**
- [ ] CVE (Escudo Cabo-Verdiano) - clientes locais
- [ ] USD (Dólar) - clientes internacionais
- [ ] EUR (Euro) - clientes europeus
- [ ] BRL (Real) - clientes brasileiros

**4. Planos e Preços:**
- [ ] Definir valores finais
- [ ] Definir limites de usuários
- [ ] Funcionalidades exclusivas por plano?

**5. Período de Teste Grátis:**
- [ ] Sim - quantos dias? (sugestão: 14 dias)
- [ ] Não - paga desde o início

**6. Métodos de Pagamento:**
- [ ] Cartão de crédito (obrigatório)
- [ ] Cartão de débito
- [ ] Pix (se usar Stripe no Brasil)
- [ ] Boleto (se usar Stripe no Brasil)
- [ ] PayPal
- [ ] Transferência bancária

---

#### **3.4 Funcionalidades a Implementar**

**Backend (Banco de Dados):**
- [ ] Tabela `subscriptions` (id, companyId, plan, status, billingCycle, etc.)
- [ ] Tabela `invoices` (histórico de cobranças)
- [ ] Tabela `payment_methods` (cartões salvos)

**Frontend (Interface):**
- [ ] Página de escolha de planos
- [ ] Checkout integrado com provedor
- [ ] Portal de gerenciamento de subscrição
- [ ] Página de confirmação de pagamento
- [ ] Histórico de faturas

**Backend (APIs):**
- [ ] API para criar subscrição
- [ ] API para cancelar subscrição
- [ ] API para atualizar método de pagamento
- [ ] API para upgrade/downgrade de plano
- [ ] Webhooks do provedor (notificações de pagamento)

**Lógica de Negócio:**
- [ ] Validação de acesso baseada em subscrição ativa
- [ ] Bloqueio automático se pagamento falhar
- [ ] Desbloqueio automático quando pagamento for aprovado
- [ ] Emails de notificação (pagamento aprovado, falha, etc.)
- [ ] Aviso de expiração próxima

**Segurança:**
- [ ] PCI-DSS compliance (dados de cartão nunca no servidor)
- [ ] Criptografia de dados sensíveis
- [ ] Proteção contra fraudes

---

## 📊 Comparação de Custos (Taxas dos Provedores)

| Provedor | Taxa por Transação | Taxa Mensal | Observações |
|----------|-------------------|-------------|-------------|
| **Stripe** | 2.9% + $0.30 | $0 | Melhor tecnologia, requer empresa EUA |
| **Paddle** | ~8% total | $0 | Incluem impostos e compliance |
| **PayPal** | 4.4% + taxa fixa | $0 | Interface menos moderna |
| **Mercado Pago** | 3.99% + taxa fixa | $0 | América Latina apenas |

---

## 🎯 Prioridades Recomendadas

### **Curto Prazo (Próximas Semanas):**
1. **Definir provedor de pagamento** (decisão crítica)
2. **Definir estrutura de planos e preços**
3. **Implementar sistema de subscrição**

### **Médio Prazo (1-2 Meses):**
4. **Adquirir domínio próprio**
5. **Implementar PWA**
6. **Marketing e captação de clientes**

### **Longo Prazo (3-6 Meses):**
7. **Publicar na Play Store** (se viável)
8. **Expansão de funcionalidades** (baseado em feedback)
9. **Integrações com outras ferramentas** (ex: Slack, Google Calendar, etc.)

---

## 💡 Outras Ideias Futuras (Brainstorming)

### **Funcionalidades Adicionais:**
- [ ] Relatórios avançados com IA
- [ ] Integração com WhatsApp Business
- [ ] Sistema de ponto eletrônico (check-in/check-out)
- [ ] Geolocalização de funcionários
- [ ] Avaliação de desempenho (360°)
- [ ] Treinamentos e certificações
- [ ] Sistema de recompensas/gamificação
- [ ] Integração com folha de pagamento
- [ ] API pública para integrações de terceiros

### **Melhorias de UX:**
- [ ] Modo escuro/claro (dark mode)
- [ ] Onboarding interativo para novos usuários
- [ ] Tour guiado das funcionalidades
- [ ] Templates de tarefas recorrentes
- [ ] Arrastar e soltar (drag & drop) para organizar

### **Expansão Internacional:**
- [ ] Suporte a mais idiomas (Espanhol, Francês)
- [ ] Adequação a leis trabalhistas de cada país
- [ ] Multi-currency (múltiplas moedas)

---

## 📞 Contatos e Links Importantes

### **URLs do Projeto:**
- **Produção:** https://organizen-qlum60.abacusai.app
- **Repositório:** /home/ubuntu/organizen

### **Documentação:**
- **Abacus.AI Help Center:** https://abacus.ai/help/howTo/chatllm
- **Domain Setup Guide:** https://abacus.ai/help/howTo/chatllm/app_deployment_and_custom_domain_how_to

### **Provedores de Pagamento:**
- **Stripe Atlas:** https://stripe.com/atlas
- **Paddle:** https://paddle.com
- **PayPal:** https://paypal.com/business
- **Paystack:** https://paystack.com

### **Registradores de Domínio:**
- **DNS.CV (Cabo Verde):** https://dns.cv
- **Namecheap:** https://namecheap.com
- **GoDaddy:** https://godaddy.com

---

## 📝 Notas Importantes

1. **Banco de Dados:** Estamos usando PostgreSQL em produção. Qualquer mudança de schema deve ser feita com cuidado para evitar perda de dados.

2. **Senhas:** Todas as senhas foram resetadas para `teste123` para facilitar testes.

3. **Backup:** Recomendado fazer backups periódicos do banco de dados.

4. **Monitoramento:** Considerar implementar ferramentas de monitoramento (Sentry, LogRocket, etc.)

---

## ✅ Status Geral do Projeto

**Estado Atual:** ✅ **Estável e Funcional**

**Última Build:** Sucesso (exit_code=0)  
**Deploy:** Online  
**Funcionalidades Core:** 100% operacionais  
**Bugs Conhecidos:** Nenhum crítico  

**Próximos Passos:**
1. Definir estratégia de monetização (subscrição)
2. Implementar sistema de pagamento
3. Adquirir domínio profissional
4. Lançar versão PWA

---

**Última Atualização:** 15 de Outubro de 2025  
**Desenvolvedor:** Bruno (Cabo Verde, Ilha do Sal 🇨🇻)  
**Assistente IA:** DeepAgent (Abacus.AI)

---

## 🚀 Para Implementar Qualquer Feature Deste Roadmap:

**Basta me informar qual funcionalidade você quer implementar e eu cuido de tudo!**

Exemplo:
- "Vamos implementar a PWA agora"
- "Quero implementar o sistema de subscrição com Paddle"
- "Vamos configurar o domínio que acabei de comprar"

**Este documento será atualizado conforme novas features forem implementadas!** ✅
