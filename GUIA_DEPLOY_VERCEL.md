# 🚀 Guia de Deploy do OrganiZen na Vercel

## 📋 Pré-requisitos

✅ Conta na Vercel (https://vercel.com)
✅ Domínio organizen.cv registado
✅ Código no GitHub (recomendado)
✅ Todas as variáveis de ambiente preparadas

---

## 🔧 Passo 1: Preparar o Repositório GitHub

### 1.1. Criar/Atualizar Repositório

```bash
# Se ainda não tens repositório:
git init
git add .
git commit -m "Preparar para deploy na Vercel"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/organizen.git
git push -u origin main

# Se já tens repositório:
git add .
git commit -m "Atualizar para deploy na Vercel"
git push
```

### 1.2. Verificar .gitignore

Garante que estes ficheiros NÃO estão no GitHub:
```
.env
.env.local
node_modules/
.next/
```

---

## 🌐 Passo 2: Deploy na Vercel

### 2.1. Importar Projeto

1. Acede a https://vercel.com/new
2. Clica em **"Import Git Repository"**
3. Seleciona o repositório **organizen**
4. Clica em **"Import"**

### 2.2. Configurar Projeto

**Framework Preset:** Next.js
**Root Directory:** `nextjs_space` ⚠️ MUITO IMPORTANTE!
**Build Command:** `yarn build`
**Output Directory:** `.next`
**Install Command:** `yarn install`

### 2.3. Adicionar Variáveis de Ambiente

Na secção **"Environment Variables"**, adiciona TODAS estas variáveis:

#### Database
```
DATABASE_URL=postgresql://role_15c138b300:ItM6GBgaFS9v8hTEjbiJxFmMcI5jfCNt@db-15c138b300.db002.hosteddb.reai.io:5432/15c138b300?connect_timeout=15
```

#### NextAuth
```
NEXTAUTH_SECRET=e4iCemyqOjcfRDJekC6m2TMRUqk1FIU4
NEXTAUTH_URL=https://www.organizen.cv
NEXT_PUBLIC_APP_URL=https://www.organizen.cv
```

#### AWS Storage
```
AWS_REGION=us-west-2
AWS_BUCKET_NAME=abacusai-apps-87e01829f3ef8a0102402ad6-us-west-2
AWS_FOLDER_PREFIX=5735/
```

#### Resend Email
```
RESEND_API_KEY=re_CCRLEEP3_4UisqwTEZPSCXSCvWTvMo3ct
```

#### Push Notifications
```
VAPID_PUBLIC_KEY=BPInIoJOCgvUczv42fqofXVC55YrBni0DonE0mTNHq-PbhD8X0fBE8-SfNYMuJ4-a5Szs1ND_l00UeFyYNmFSQc
VAPID_PRIVATE_KEY=PDTjjzmCe0G-njzUXIsE_T56ARRmkbtmSs8nsdDp-ng
NEXT_PUBLIC_VAPID_KEY=BPInIoJOCgvUczv42fqofXVC55YrBni0DonE0mTNHq-PbhD8X0fBE8-SfNYMuJ4-a5Szs1ND_l00UeFyYNmFSQc
```

#### Cron Jobs
```
CRON_SECRET=organizen-cron-secret-2024-change-in-production
```

### 2.4. Deploy

Clica em **"Deploy"** e aguarda 3-5 minutos.

✅ O deploy vai criar um URL temporário como: `organizen-xyz.vercel.app`

---

## 🔗 Passo 3: Configurar Domínio organizen.cv

### 3.1. Na Vercel

1. Vai ao dashboard do projeto
2. Clica em **"Settings"** → **"Domains"**
3. Adiciona os domínios:
   - `organizen.cv`
   - `www.organizen.cv`

### 3.2. No Registo do Domínio (ex: GoDaddy, Namecheap, etc.)

Configura os DNS records:

#### Opção A: CNAME Records (Recomendado)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600

Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

#### Opção B: Nameservers Vercel
Se preferires usar nameservers da Vercel:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

⏰ **Tempo de propagação:** 24-48 horas (normalmente 1-2 horas)

---

## 🔒 Passo 4: Atualizar Variáveis de Ambiente para Produção

### 4.1. Na Vercel, atualiza:

```
NEXTAUTH_URL=https://www.organizen.cv
NEXT_PUBLIC_APP_URL=https://www.organizen.cv
```

### 4.2. Redeploy

1. Vai a **"Deployments"**
2. Clica nos **3 pontos** do último deploy
3. Seleciona **"Redeploy"**

---

## ✅ Passo 5: Verificação Final

### 5.1. Testa estas funcionalidades:

- [ ] Login funciona (https://www.organizen.cv/login)
- [ ] Dashboard carrega
- [ ] Chat envia mensagens
- [ ] Upload de imagens funciona
- [ ] Notificações push funcionam
- [ ] PWA instala corretamente
- [ ] Emails são enviados
- [ ] Cron jobs executam (verificar em 1h)

### 5.2. Verificar Logs

Se algo não funcionar:
1. Vai a **"Deployments"** → **"Functions"**
2. Clica na função com erro
3. Verifica os logs

---

## 🐛 Troubleshooting Comum

### Erro: "Root Directory not found"
**Solução:** Certifica-te que o Root Directory está configurado para `nextjs_space`

### Erro: "Build failed"
**Solução:** Verifica se todas as variáveis de ambiente estão configuradas

### Erro: "Database connection failed"
**Solução:** Verifica se `DATABASE_URL` está correto e sem espaços extras

### Erro: "NextAuth configuration error"
**Solução:** Certifica-te que `NEXTAUTH_URL` e `NEXTAUTH_SECRET` estão configurados

### PWA não instala
**Solução:** 
1. Força HTTPS: Vai a Settings → General → Force HTTPS
2. Verifica se os ícones PWA estão no `/public`

### Domínio não resolve
**Solução:** 
1. Verifica DNS com: `nslookup organizen.cv`
2. Aguarda até 48h para propagação
3. Testa com: `dig organizen.cv`

---

## 📊 Monitorização Pós-Deploy

### Métricas Vercel
- **Analytics:** https://vercel.com/dashboard/analytics
- **Speed Insights:** Ativa em Settings → Speed Insights
- **Logs:** Vercel dashboard → Functions → View Logs

### Alertas Importantes
1. Configura notificações por email para erros
2. Monitoriza uso de banda (Vercel tem limites no plano gratuito)
3. Verifica execução dos cron jobs diariamente

---

## 🔄 Atualizações Futuras

### Deploy Automático
Cada push para `main` no GitHub dispara deploy automático.

### Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd /home/ubuntu/organizen
vercel --prod
```

### Rollback
Se algo correr mal:
1. Vai a **"Deployments"**
2. Encontra o último deploy funcional
3. Clica **"Promote to Production"**

---

## 📞 Suporte

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Next.js Docs:** https://nextjs.org/docs

---

## ✨ Próximos Passos Após Deploy

1. ✅ Configurar monitorização de uptime (ex: UptimeRobot)
2. ✅ Configurar backups automáticos da base de dados
3. ✅ Criar documentação para utilizadores beta
4. ✅ Preparar formulário de feedback
5. ✅ Configurar analytics (Google Analytics, se necessário)

---

**🎉 Boa sorte com o deploy! O OrganiZen está pronto para os testes beta!**
