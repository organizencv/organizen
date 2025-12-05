# Diagnóstico de Deploy Vercel - OrganiZen

## Status Atual
- ❌ Deployment `040c6fe` falhou
- ⚠️ Múltiplos projetos na Vercel (organizen, organizenapp, organizenappcv)
- 🎯 Projeto ativo: `organizenapp` (www.organizen.cv)

## Checklist de Verificação

### 1. Variáveis de Ambiente na Vercel
Verifique em: **Settings → Environment Variables**

**Obrigatórias:**
- [ ] `DATABASE_URL` - String de conexão PostgreSQL
- [ ] `NEXTAUTH_SECRET` - Segredo de autenticação
- [ ] `NEXTAUTH_URL` - https://www.organizen.cv
- [ ] `AWS_S3_ACCESS_KEY_ID` - Chave S3
- [ ] `AWS_S3_SECRET_ACCESS_KEY` - Segredo S3
- [ ] `AWS_S3_REGION` - Região S3
- [ ] `AWS_BUCKET_NAME` - Nome do bucket
- [ ] `AWS_FOLDER_PREFIX` - Prefixo de pasta
- [ ] `CRON_SECRET` - Segredo de cron jobs
- [ ] `VAPID_PUBLIC_KEY` - Chave pública push
- [ ] `VAPID_PRIVATE_KEY` - Chave privada push

### 2. Build Settings na Vercel
Verifique em: **Settings → Build & Development Settings**

- [ ] **Framework Preset:** Next.js
- [ ] **Root Directory:** `nextjs_space`
- [ ] **Build Command:** `yarn build`
- [ ] **Output Directory:** `.next`
- [ ] **Install Command:** `yarn install && yarn prisma generate`

### 3. Git Settings
Verifique em: **Settings → Git**

- [ ] **Connected Git Repository:** `organizencv/organizen`
- [ ] **Production Branch:** `main`
- [ ] **Deploy Hooks:** (opcional)

### 4. Domain Settings
Verifique em: **Settings → Domains**

- [ ] **Primary Domain:** `www.organizen.cv`
- [ ] **SSL Certificate:** Ativo

## Logs de Erro Comuns e Soluções

### Erro: "Could not find a production build in nextjs_space/.next"
**Causa:** Root directory incorreto
**Solução:** Configurar `rootDirectory: "nextjs_space"` em vercel.json

### Erro: "PrismaClientInitializationError"
**Causa:** DATABASE_URL não configurado ou inválido
**Solução:** Adicionar DATABASE_URL nas variáveis de ambiente

### Erro: "Module not found: Can't resolve '@prisma/client'"
**Causa:** Prisma client não foi gerado
**Solução:** Adicionar `yarn prisma generate` no install command

### Erro: "Error: ENOENT: no such file or directory"
**Causa:** Arquivos não encontrados no build
**Solução:** Verificar se todos os arquivos foram commitados no Git

## Próximos Passos

1. **Verificar logs de erro** do deployment `040c6fe`
2. **Comparar** configurações da Vercel com este checklist
3. **Corrigir** qualquer item marcado com ❌
4. **Fazer novo deployment** após correções

## Comandos Úteis

### Ver logs localmente:
```bash
cd /home/ubuntu/organizen/nextjs_space
yarn build 2>&1 | tee build.log
```

### Testar Prisma:
```bash
cd /home/ubuntu/organizen/nextjs_space
yarn prisma generate
yarn prisma db push --preview-feature
```

### Verificar variáveis de ambiente:
```bash
cat /home/ubuntu/organizen/nextjs_space/.env
```

## Contato para Suporte

Se o problema persistir após seguir este checklist, forneça:
1. Screenshot dos logs de erro completos
2. Screenshot das configurações de Build & Development
3. Screenshot das variáveis de ambiente (sem valores sensíveis)
