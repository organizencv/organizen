# Guia de Deploy no Vercel - OrganiZen

## ⚠️ PROBLEMA IDENTIFICADO

O erro `path0/path0` indica configuração incorreta do Root Directory no Vercel.

## ✅ SOLUÇÃO: Configurar Root Directory

### Opção 1: Configurar via Vercel Dashboard (RECOMENDADO)

1. **Acesse o projeto no Vercel**:
   - Vá para: https://vercel.com/bruno-duarte-s-projects/organizeapp

2. **Abra as configurações**:
   - Clique em **Settings** (⚙️)
   - Vá para **General**

3. **Configure o Root Directory**:
   - Procure por "Root Directory"
   - Clique em **Edit**
   - Digite: `nextjs_space`
   - Clique em **Save**

4. **Faça um novo deploy**:
   - Vá para **Deployments**
   - Clique em **Redeploy** no último deployment

### Opção 2: Criar novo projeto (ALTERNATIVA)

Se a Opção 1 não funcionar:

1. **Delete o projeto atual no Vercel**
2. **Crie um novo projeto**:
   - Import do repositório: `organizencv/organizen`
   - **Root Directory**: `nextjs_space` ← IMPORTANTE!
   - Framework Preset: Next.js

## 📋 Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas no Vercel:

```bash
# Database
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_DATABASE_URL=postgresql://...
POSTGRES_DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=sua-chave-secreta

# App URLs
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app

# Email (Resend)
RESEND_API_KEY=sua-chave-resend

# AWS S3
AWS_REGION=us-west-2
AWS_BUCKET_NAME=seu-bucket
AWS_FOLDER_PREFIX=5735/

# VAPID (Push Notifications)
VAPID_PUBLIC_KEY=sua-chave-publica
VAPID_PRIVATE_KEY=sua-chave-privada
NEXT_PUBLIC_VAPID_KEY=sua-chave-publica

# Cron Job Secret
CRON_SECRET=change-in-production
```

## 🔧 Correções Aplicadas

✅ Adicionado `export const dynamic = 'force-dynamic'` nas rotas API
✅ Corrigido problema de "Dynamic server usage" 
✅ Rotas API agora são renderizadas dinamicamente

## 🚀 Após Configurar

1. **Commit e push das alterações**:
```bash
git add .
git commit -m "fix: configure dynamic routes for Vercel deployment"
git push origin main
```

2. **Aguarde o deploy automático** ou faça manualmente no Vercel

3. **Verifique o deploy**:
   - Acesse: https://organizeapp-git-main-bruno-duarte-s-projects.vercel.app
   - Teste o login com: john@doe.com / password123

## 📞 Se Ainda Houver Problemas

1. **Verifique os Build Logs** no Vercel
2. **Certifique-se** de que o Root Directory está como `nextjs_space`
3. **Verifique** se todas as variáveis de ambiente estão configuradas
4. **Tente** fazer um "Clear Build Cache and Redeploy"

## 🎯 Checklist Final

- [ ] Root Directory configurado como `nextjs_space`
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Banco de dados Vercel Postgres conectado
- [ ] Build passou sem erros
- [ ] Aplicação acessível via URL do Vercel

---

**Data da última atualização**: 02/11/2025
**Status**: Pronto para deploy ✅
