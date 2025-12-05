# 🚀 Como Corrigir o Deploy no Vercel - Passo a Passo

## ❌ O Problema

O erro `path0/path0/.next/routes-manifest.json` indica que o **Root Directory** não está configurado corretamente no Vercel.

## ✅ A Solução (3 minutos)

### PASSO 1: Abrir Configurações do Projeto

1. Acesse: https://vercel.com/bruno-duarte-s-projects/organizeapp
2. Clique na aba **Settings** (⚙️ ícone de engrenagem)
3. No menu lateral esquerdo, clique em **General**

### PASSO 2: Configurar Root Directory

Na seção **Build & Development Settings**:

1. Procure por **Root Directory**
2. Clique no botão **Edit** (ou **Configure**)
3. Digite: `nextjs_space`
4. Clique em **Save**

**IMPORTANTE**: O Root Directory DEVE ser `nextjs_space` porque:
- Seu código Next.js está em `/organizen/nextjs_space/`
- Não está na raiz do repositório

### PASSO 3: Redeploy

1. Volte para a aba **Deployments**
2. No deployment mais recente (o que falhou), clique nos 3 pontinhos `...`
3. Clique em **Redeploy**
4. ✅ Aguarde o build completar (deve levar ~5 minutos)

---

## 🔧 O Que Foi Corrigido no Código

Acabei de aplicar estas correções e fazer push para o GitHub:

✅ **Adicionado `export const dynamic = 'force-dynamic'`** em 14 rotas API
✅ **Corrigido erros de "Dynamic server usage"** durante o build
✅ **Atualizado schema.prisma** para usar `POSTGRES_URL`

---

## 📋 Checklist de Variáveis de Ambiente

Verifique se estas variáveis estão no Vercel (**Settings > Environment Variables**):

### 🗄️ Database (obrigatório)
- `POSTGRES_URL` ← conectado ao Vercel Postgres
- `POSTGRES_PRISMA_DATABASE_URL` 
- `POSTGRES_DATABASE_URL`

### 🔐 NextAuth (obrigatório)
- `NEXTAUTH_URL` = `https://organizeapp-git-main-bruno-duarte-s-projects.vercel.app`
- `NEXTAUTH_SECRET` = (uma string aleatória segura)

### 📱 App URLs (obrigatório)
- `NEXT_PUBLIC_APP_URL` = `https://organizeapp-git-main-bruno-duarte-s-projects.vercel.app`

### 📧 Email - Resend (obrigatório)
- `RESEND_API_KEY` = (sua chave do Resend.com)

### ☁️ AWS S3 Storage (obrigatório)
- `AWS_REGION` = `us-west-2`
- `AWS_BUCKET_NAME` = (nome do bucket criado pelo Vercel)
- `AWS_FOLDER_PREFIX` = `5735/`

### 🔔 Push Notifications (obrigatório)
- `VAPID_PUBLIC_KEY` = (chave pública)
- `VAPID_PRIVATE_KEY` = (chave privada)
- `NEXT_PUBLIC_VAPID_KEY` = (mesma chave pública)

### ⏰ Cron Jobs (opcional)
- `CRON_SECRET` = `change-in-production`

---

## 🎯 Ordem de Ações

1. ✅ **FEITO**: Código corrigido e enviado para GitHub
2. ⏳ **VOCÊ FAZ**: Configurar Root Directory no Vercel = `nextjs_space`
3. ⏳ **VOCÊ FAZ**: Verificar variáveis de ambiente
4. ⏳ **VOCÊ FAZ**: Fazer Redeploy
5. 🎉 **Sucesso**: App funcionando!

---

## 🆘 Se Ainda Houver Erro

1. **Verifique o Build Log** no Vercel:
   - Vá em **Deployments**
   - Clique no deployment
   - Veja a aba **Build Logs**

2. **Limpe o cache**:
   - No deployment, clique em `...`
   - Escolha **Redeploy** 
   - Marque **Clear build cache**

3. **Verifique se o Root Directory foi salvo**:
   - Vá em Settings > General
   - Confirme que Root Directory = `nextjs_space`

---

## 📞 URLs do Projeto

- **GitHub**: https://github.com/organizencv/organizen
- **Vercel Project**: https://vercel.com/bruno-duarte-s-projects/organizeapp
- **App URL** (após deploy): https://organizeapp-git-main-bruno-duarte-s-projects.vercel.app

---

**Credenciais de Teste**:
- Email: `john@doe.com`
- Password: `password123`

---

## ✨ Status Atual

- ✅ Código corrigido
- ✅ Push feito para GitHub
- ⏳ Aguardando você configurar Root Directory no Vercel
- ⏳ Aguardando redeploy

**Próximo passo**: Configure o Root Directory como `nextjs_space` no Vercel!
