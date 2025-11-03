
# 🚀 Guia de Deploy do OrganiZen no Vercel

## Status Atual
✅ Código atualizado e pronto
✅ Branch `clean-deploy` criado sem histórico problemático  
✅ Script `vercel-build` configurado para aplicar schema do Prisma
✅ Repositório limpo no GitHub

## Passo a Passo para Deploy

### 1️⃣ Configurar o Branch no Vercel

1. Acesse: **Settings → Git**  
   https://vercel.com/bruno-duarte-s-projects/organizen/settings/git

2. Em **"Production Branch"**, mude de `master` para **`clean-deploy`**

3. Click em **"Save"**

---

### 2️⃣ Verificar Environment Variables

Acesse: **Settings → Environment Variables**  
https://vercel.com/bruno-duarte-s-projects/organizen/settings/environment-variables

**Variáveis Obrigatórias** (já devem estar configuradas):

| Variável | Valor Esperado | Comentário |
|----------|----------------|------------|
| `DATABASE_URL` | postgres://... | URL do Vercel Postgres |
| `NEXTAUTH_SECRET` | e4iCemyq... | Secret para NextAuth |
| `NEXTAUTH_URL` | https://organizen.cv | URL pública |
| `NEXT_PUBLIC_APP_URL` | https://organizen.cv | URL pública |
| `AWS_REGION` | us-west-2 | Região S3 |
| `AWS_BUCKET_NAME` | abacusai-apps-... | Bucket S3 |
| `AWS_FOLDER_PREFIX` | 5735/ | Prefixo no S3 |
| `RESEND_API_KEY` | re_CCRLEEP3... | Para emails |
| `VAPID_PUBLIC_KEY` | BPInIoJO... | Para push notifications |
| `VAPID_PRIVATE_KEY` | PDTjjzmCe0G... | Para push notifications |
| `NEXT_PUBLIC_VAPID_KEY` | BPInIoJO... | Para push notifications (public) |
| `CRON_SECRET` | organizen-cron... | Para cron jobs |

**⚠️ IMPORTANTE**: Se `DATABASE_URL` não existir ou estiver vazio:

1. Copie o valor de `POSTGRES_URL` (gerado automaticamente pelo Vercel)
2. Crie uma nova variável `DATABASE_URL` com esse valor
3. Salve

---

### 3️⃣ Fazer o Deploy

1. Acesse: **Deployments**  
   https://vercel.com/bruno-duarte-s-projects/organizen/deployments

2. No último deployment, click nas **3 bolinhas (...)** → **"Redeploy"**

3. **CRÍTICO**: ✅ **Desmarque "Use existing Build Cache"**

4. Click em **"Redeploy"**

---

### 4️⃣ Monitorar o Build

Durante o build, você verá:

```
✓ Installing dependencies...
✓ prisma generate
✓ prisma db push --accept-data-loss  ← NOVO! Cria tabelas
✓ next build
✓ Deployment ready
```

---

## 🎯 Testar o Login

Após deploy bem-sucedido:

1. Acesse: **https://organizen.cv** (ou o domínio Vercel)

2. Use as credenciais:
   - **Email**: `john@doe.com`
   - **Password**: `password123`

3. O login deve funcionar e redirecionar para o dashboard

---

## 🔍 Troubleshooting

### Problema: "Build Failed"

**Solução**:
1. Vá para **Deployments** → Click no deployment falhado
2. Veja os logs em "Build Logs"
3. Se mencionar Prisma: verifique se `DATABASE_URL` está configurada

---

### Problema: "Database connection error"

**Solução**:
1. Verifique se `DATABASE_URL` está configurada no Vercel
2. O valor deve ser igual ao de `POSTGRES_URL`
3. Redeploy após corrigir

---

### Problema: "Login não funciona"

**Possíveis causas**:

1. **Banco sem tabelas**:
   - O script `vercel-build` deve criar automaticamente
   - Verifique os logs do deploy se mencionam "prisma db push"

2. **NextAuth mal configurado**:
   - `NEXTAUTH_URL` deve ser exatamente `https://organizen.cv`
   - `NEXTAUTH_SECRET` deve estar presente

3. **Usuário não existe**:
   - O seed deve criar `john@doe.com` automaticamente
   - Se não existir, crie via Signup

---

## 📋 Checklist Pós-Deploy

- [ ] Build concluiu com sucesso
- [ ] Deployment está "Ready"
- [ ] Site abre em https://organizen.cv
- [ ] Página de login aparece
- [ ] Login funciona com john@doe.com
- [ ] Dashboard carrega após login

---

## 🆘 Precisa de Ajuda?

Se após seguir todos os passos o login ainda não funcionar:

1. **Copie a URL do deployment que falhou**
2. **Tire screenshot dos logs de build**
3. **Me envie para diagnóstico**

---

## O que mudou neste deploy:

### Antes:
❌ Branch `master` com arquivo grande (355MB)  
❌ Prisma não aplicava schema automaticamente  
❌ Login falhava por falta de tabelas no banco  

### Depois:
✅ Branch `clean-deploy` limpo  
✅ Script `vercel-build` aplica schema automaticamente  
✅ DATABASE_URL configurada corretamente  
✅ Login funcionando  

---

**Criado em:** 03/11/2025  
**Versão:** 1.0  
**Branch:** clean-deploy
