
# ⚡ Quick Start - Teste Local OrganiZen

## 🚀 Iniciar em 3 Passos

### 1️⃣ Instalar Dependências
```bash
cd /home/ubuntu/organizen/nextjs_space
yarn install
yarn prisma generate
```

### 2️⃣ Iniciar Servidor
```bash
yarn dev
```

### 3️⃣ Aceder à Aplicação
Abre no navegador: **http://localhost:3000**

---

## 🔑 Credenciais de Teste

### 👨‍💼 Admin
- **Email:** `john@doe.com`
- **Password:** `johndoe123`
- **Permissões:** Acesso total ao sistema

### 👩‍💼 Manager
- **Email:** `maria@teste.com`
- **Password:** `maria123`
- **Permissões:** Gestão de equipa

### 👨‍💻 Employee
- **Email:** `carlos@teste.com`
- **Password:** `carlos123`
- **Permissões:** Utilizador básico

---

## 🧪 Testes Rápidos

### ✅ Chat com Mídia
1. Login com `john@doe.com`
2. Vai para `/chat`
3. Pesquisa "maria" ou "carlos"
4. Cria conversa ou grupo
5. Clica em 📎 para enviar ficheiros

### ✅ Eventos com Galeria
1. Vai para `/events`
2. Cria novo evento
3. Adiciona imagens
4. Abre chat do evento
5. Envia ficheiros no chat

### ✅ PWA
1. Abre DevTools (F12)
2. Application > Service Workers
3. Verifica `organizen-v2.1.0`

---

## 🔧 Comandos Úteis

```bash
# Build de produção
yarn build

# Verificar erros TypeScript
yarn tsc --noEmit

# Abrir Prisma Studio (UI para DB)
yarn prisma studio

# Limpar e reinstalar
rm -rf node_modules .next && yarn install
```

---

## ⚠️ Problemas Comuns

### Porta 3000 ocupada?
```bash
PORT=3001 yarn dev
```

### Erro de módulo Prisma?
```bash
yarn prisma generate
```

### Service Worker não atualiza?
**Chrome:** Ctrl+Shift+R (hard refresh)  
**DevTools:** Application > Service Workers > Unregister

---

## 📱 Testar no Telemóvel

### Usar ngrok (Recomendado)
```bash
# Terminal 1: Servidor dev
yarn dev

# Terminal 2: ngrok
npx ngrok http 3000
```
Usa o URL `https://xxx.ngrok.io` no telemóvel

---

## ✅ Features Implementadas

- ✅ Chat com pesquisa de utilizadores
- ✅ Conversas 1:1 e grupos
- ✅ Upload de imagens, vídeos, áudios, documentos
- ✅ Chat de eventos com mídia
- ✅ Galeria de imagens em eventos
- ✅ PWA v2.1.0 com auto-update
- ✅ Notificações push
- ✅ Gestão de departamentos
- ✅ Sistema de tarefas
- ✅ Calendário
- ✅ Gestão de utilizadores

---

## 📚 Documentação Completa

Ver: `INSTRUCOES_TESTE_LOCAL.md` (guia detalhado)

---

**Pronto para testar! 🎉**
