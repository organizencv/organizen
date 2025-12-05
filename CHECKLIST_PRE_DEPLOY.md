# ✅ Checklist Pré-Deploy - OrganiZen

## 🔍 Verificações Técnicas

### Código
- [ ] Todos os ficheiros commitados no Git
- [ ] Sem erros no build local (`yarn build`)
- [ ] Sem warnings críticos no console
- [ ] `.env` não está no repositório (verificar .gitignore)
- [ ] Versão do Node.js compatível (18.x ou superior)

### Dependências
- [ ] `package.json` atualizado
- [ ] `yarn.lock` presente e atualizado
- [ ] Sem vulnerabilidades críticas (`yarn audit`)

### Base de Dados
- [ ] Prisma schema sincronizado
- [ ] Migrações aplicadas
- [ ] Seed data criado (utilizador admin teste)
- [ ] Conexão DATABASE_URL válida e acessível publicamente

### Variáveis de Ambiente
- [ ] DATABASE_URL configurado
- [ ] NEXTAUTH_SECRET gerado e seguro
- [ ] NEXTAUTH_URL com domínio correto
- [ ] AWS credentials configuradas
- [ ] RESEND_API_KEY válido
- [ ] VAPID keys para push notifications
- [ ] CRON_SECRET configurado

---

## 🌐 Configuração Vercel

### Projeto
- [ ] Root Directory: `nextjs_space`
- [ ] Framework: Next.js detectado
- [ ] Build Command: `yarn build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `yarn install`

### Variáveis de Ambiente
- [ ] Todas as variáveis adicionadas
- [ ] Sem espaços ou caracteres especiais indesejados
- [ ] URLs com `https://` onde necessário
- [ ] Variáveis `NEXT_PUBLIC_*` marcadas como "Production"

### Domínio
- [ ] DNS configurado no registrador
- [ ] Domínio adicionado na Vercel
- [ ] Certificado SSL ativo (automático na Vercel)
- [ ] Redirect de `organizen.cv` para `www.organizen.cv` configurado (opcional)

---

## 🔐 Segurança

### Credenciais
- [ ] NEXTAUTH_SECRET gerado com `openssl rand -base64 32`
- [ ] CRON_SECRET alterado do valor padrão
- [ ] Passwords de teste documentados mas não no código
- [ ] API keys de produção (não usar keys de teste)

### Acesso
- [ ] Rotas protegidas com autenticação
- [ ] Roles de utilizador configurados corretamente
- [ ] CORS configurado (se necessário)
- [ ] Rate limiting considerado para APIs públicas

---

## 📱 Funcionalidades PWA

### Manifest
- [ ] `/public/manifest.json` configurado
- [ ] Nome correto: "OrganiZen"
- [ ] URLs de ícones corretas
- [ ] `start_url` correto
- [ ] `theme_color` e `background_color` definidos

### Service Worker
- [ ] `/public/sw.js` presente
- [ ] Estratégia de cache configurada
- [ ] Offline fallback funcional

### Ícones
- [ ] Todos os tamanhos de ícones presentes:
  - [ ] 72x72, 96x96, 128x128, 144x144
  - [ ] 152x152, 192x192, 384x384, 512x512
  - [ ] Ícones maskable (192x192 e 512x512)
- [ ] Favicon.svg presente

---

## 📧 Serviços Externos

### Email (Resend)
- [ ] API key válido e com créditos
- [ ] Domínio verificado (se aplicável)
- [ ] Templates de email testados
- [ ] Email de remetente configurado

### Storage (AWS S3)
- [ ] Bucket criado e acessível
- [ ] Permissões configuradas (IAM)
- [ ] Pasta prefix correta
- [ ] CORS configurado no bucket

### Push Notifications
- [ ] VAPID keys geradas
- [ ] Service worker registado corretamente
- [ ] Permissões de notificação testadas

---

## 🔄 Cron Jobs

### Configuração
- [ ] `/api/cron/send-digests` criado
- [ ] `/api/cron/shift-reminders` criado
- [ ] `/api/cron/birthday-notifications` criado
- [ ] CRON_SECRET validado em cada endpoint
- [ ] Schedules corretos no vercel.json

### Testes
- [ ] Endpoints acessíveis com `curl` e CRON_SECRET
- [ ] Logs de execução funcionais
- [ ] Notificações enviadas corretamente

---

## 🧪 Testes Finais

### Autenticação
- [ ] Login com credenciais teste funciona
- [ ] Logout funciona
- [ ] Reset de password (se implementado)
- [ ] Sessões persistem corretamente

### Páginas Principais
- [ ] Dashboard carrega
- [ ] Lista de utilizadores funciona
- [ ] Departamentos listam corretamente
- [ ] Turnos são criados/editados
- [ ] Tarefas funcionam completamente
- [ ] Mensagens enviam/recebem
- [ ] Chat 1:1 e grupos funcionam
- [ ] Eventos criam/editam
- [ ] Calendário exibe dados
- [ ] Relatórios geram

### Uploads
- [ ] Imagens de perfil sobem
- [ ] Anexos de mensagens funcionam
- [ ] Mídia de chat (imagens, vídeos, áudio) funciona
- [ ] Imagens de eventos sobem
- [ ] Anexos de tarefas funcionam

### Mobile
- [ ] Layout responsivo funciona
- [ ] PWA instala no Android
- [ ] PWA instala no iOS
- [ ] Notificações push recebem
- [ ] Offline mode funciona (básico)

---

## 📊 Performance

### Métricas
- [ ] Lighthouse score > 80 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 90 (SEO)
- [ ] PWA score 100%

### Otimizações
- [ ] Imagens otimizadas (Next/Image)
- [ ] Fonts locais carregados
- [ ] CSS minimizado
- [ ] JS code-splitting funcional

---

## 📝 Documentação

### Técnica
- [ ] README.md atualizado
- [ ] Variáveis de ambiente documentadas
- [ ] Instruções de deploy criadas
- [ ] Arquitectura documentada (se complexa)

### Utilizadores
- [ ] Credenciais de teste beta documentadas
- [ ] Manual básico criado (ou planeado)
- [ ] FAQs preparadas
- [ ] Vídeo tutorial considerado

---

## 🚀 Go-Live

### Antes do Deploy
- [ ] Backup da base de dados criado
- [ ] Plano de rollback definido
- [ ] Contactos de suporte preparados
- [ ] Horário de deploy escolhido (evitar horários de pico)

### Durante o Deploy
- [ ] Monitorizar logs em tempo real
- [ ] Verificar build completo sem erros
- [ ] Confirmar DNS propagado
- [ ] Testar login imediatamente

### Após o Deploy
- [ ] Confirmar todas as funcionalidades principais
- [ ] Verificar emails chegam
- [ ] Confirmar notificações push funcionam
- [ ] Validar cron jobs executam (aguardar 1h)
- [ ] Testar em diferentes dispositivos
- [ ] Testar em diferentes browsers

---

## 📞 Plano de Contingência

### Se o Deploy Falhar
1. Verificar logs de build na Vercel
2. Confirmar variáveis de ambiente
3. Testar build local: `yarn build`
4. Verificar Root Directory configurado
5. Contactar suporte Vercel se necessário

### Se Houver Bugs em Produção
1. Documentar o bug detalhadamente
2. Verificar se é específico de produção
3. Fazer rollback para versão anterior se crítico
4. Corrigir localmente, testar e fazer novo deploy

### Se o Domínio Não Resolver
1. Verificar configuração DNS: `nslookup organizen.cv`
2. Aguardar propagação (até 48h)
3. Verificar se domínio está ativo no registrador
4. Usar URL Vercel temporário enquanto resolve

---

## ✅ Aprovação Final

Antes de fazer deploy para empresas beta:

- [ ] **Bruno:** Testou todas as funcionalidades principais
- [ ] **Bruno:** Aprovou o design e UX
- [ ] **Bruno:** Confirmou dados de teste criados
- [ ] **Bruno:** Preparou mensagem de boas-vindas para beta testers
- [ ] **Bruno:** Definiu critérios de sucesso do beta
- [ ] **Bruno:** Preparou formulário de feedback

---

**🎯 Status:** ⬜ Pendente | ⏳ Em Progresso | ✅ Completo

**📅 Data Target:** _______________

**👤 Responsável:** Bruno (Cabo Verde)

---

**Notas Adicionais:**

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
