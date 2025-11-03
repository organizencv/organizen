
# Guia de Deployment - OrganiZen

## ✅ Variáveis de Ambiente Necessárias no Vercel

Aceda às configurações do projeto no Vercel:
1. Vá a https://vercel.com/bruno-duarte-s-projects/organizen app
2. Settings → Environment Variables

### Variáveis Obrigatórias

```bash
# Database
DATABASE_URL=postgresql://role_15c138b300:ItM6GBgaFS9v8hTEjbiJxFmMcI5jfCNt@db-15c138b300.db002.hosteddb.reai.io:5432/15c138b300?connect_timeout=15

# NextAuth
NEXTAUTH_SECRET=e4iCemyqOjcfRDJekC6m2TMRUqk1FIU4
NEXTAUTH_URL=https://organizen.cv

# AWS S3 (Hosted Storage)
AWS_PROFILE=hosted_storage
AWS_REGION=us-west-2
AWS_BUCKET_NAME=abacusai-apps-87e01829f3ef8a0102402ad6-us-west-2
AWS_FOLDER_PREFIX=5735/

# Resend (Email)
RESEND_API_KEY=re_CCRLEEP3_4UisqwTEZPSCXSCvWTvMo3ct

# VAPID (Push Notifications)
VAPID_PUBLIC_KEY=BPInIoJOCgvUczv42fqofXVC55YrBni0DonE0mTNHq-PbhD8X0fBE8-SfNYMuJ4-a5Szs1ND_l00UeFyYNmFSQc
VAPID_PRIVATE_KEY=PDTjjzmCe0G-njzUXIsE_T56ARRmkbtmSs8nsdDp-ng
NEXT_PUBLIC_VAPID_KEY=BPInIoJOCgvUczv42fqofXVC55YrBni0DonE0mTNHq-PbhD8X0fBE8-SfNYMuJ4-a5Szs1ND_l00UeFyYNmFSQc

# Cron Job Security
CRON_SECRET=organizen-cron-secret-2024-change-in-production

# Public URLs
NEXT_PUBLIC_APP_URL=https://organizen.cv
```

## 📋 Checklist de Deployment

### 1. GitHub Repository
- ✅ Repositório: `organizencv/organizen`
- ✅ Branch: `main`
- ✅ Último commit: prisma generate adicionado ao build

### 2. Vercel Project
- ✅ Projeto conectado ao GitHub
- ⚠️ Garantir que TODAS as variáveis acima estão configuradas
- ✅ Build Command: `prisma generate && next build` (configurado no vercel.json)
- ✅ Framework Preset: Next.js
- ✅ Root Directory: `nextjs_space`

### 3. Domínio
- ✅ Domínio: `organizen.cv`
- ⚠️ DNS Records configurados (ver próxima secção)

## 🌐 Configuração DNS para organizen.cv

### No Namecheap (ou seu registrador de domínio)

#### A Records (para o domínio principal)
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

```
Type: A Record
Host: www
Value: 76.76.21.21
TTL: Automatic
```

#### CNAME (se preferir)
Alternativamente, pode usar CNAME:
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com.
TTL: Automatic
```

### DNS Records do Resend (Email)
Estes já devem estar configurados conforme as imagens fornecidas:

**MX Record:**
```
Type: MX
Host: send
Value: feedback-smtp.sa-east-1.amazonses.com
Priority: 10
```

**TXT Records:**
```
Type: TXT
Host: send
Value: v=spf1 include:amazonses.com ~all

Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none;
```

**Verificação do Domínio:**
```
Type: TXT
Host: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEB...
```

## 🚀 Processo de Deployment

1. **Verificar Variáveis de Ambiente**
   - Aceda a Vercel → Settings → Environment Variables
   - Confirme que todas as variáveis listadas acima estão configuradas
   - Use "Production", "Preview" e "Development" para todas

2. **Verificar Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `nextjs_space`
   - Build Command: (será usado do vercel.json)
   - Output Directory: (deixar padrão)

3. **Fazer Deploy**
   - O deploy é automático quando faz push para o GitHub
   - Ou pode fazer deploy manual no Vercel: "Deploy" → "Redeploy"

4. **Monitorizar o Build**
   - Acompanhe os logs de build no Vercel
   - Se houver erros, verifique:
     - Se o Prisma Client foi gerado
     - Se todas as variáveis de ambiente estão presentes
     - Se o yarn.lock está atualizado

## 🐛 Resolução de Problemas Comuns

### Erro: "Module '@prisma/client' has no exported member"
**Solução:** O Prisma Client não foi gerado
```bash
cd /home/ubuntu/organizen/nextjs_space
yarn prisma generate
git add .
git commit -m "Regenerate Prisma Client"
git push
```

### Erro: "NEXTAUTH_URL is not set"
**Solução:** Adicionar variável no Vercel
- NEXTAUTH_URL=https://organizen.cv
- NEXT_PUBLIC_APP_URL=https://organizen.cv

### Erro: "Command 'yarn run build' exited with 1"
**Solução:** Verificar logs detalhados
- Pode ser erro de TypeScript
- Pode ser falta de variáveis de ambiente
- Pode ser problema com dependencies

### Domínio não funciona
**Solução:** Verificar DNS
1. Aguarde propagação DNS (pode demorar até 48h, mas normalmente é rápido)
2. Use `dig organizen.cv` ou https://dnschecker.org para verificar
3. Certifique-se que os A Records apontam para 76.76.21.21

## 📧 Configurar Email Sending

O Resend já está configurado com o domínio `organizen.cv`. Para testar:

1. Aceda ao dashboard do Resend
2. Verifique se o domínio está verificado
3. Teste enviando um email de teste

## ✅ Verificação Final

Após o deployment, teste:

1. ✅ Acesso ao site: https://organizen.cv
2. ✅ Login funciona
3. ✅ Upload de imagens (S3)
4. ✅ Envio de emails (Resend)
5. ✅ Push notifications
6. ✅ Database connection

## 🔄 Próximos Passos Após Deploy Bem-Sucedido

1. Criar conta de administrador inicial
2. Configurar branding da empresa
3. Criar departamentos e equipas
4. Convidar utilizadores
5. Configurar templates de email personalizados

---

## 📞 Suporte

Se tiver problemas com o deployment, verifique:
- Logs do Vercel: https://vercel.com/bruno-duarte-s-projects/organizenapp
- GitHub Actions (se configurado)
- Console do navegador para erros de client-side

**Data de criação:** 2025-11-01  
**Última atualização:** 2025-11-01
