# 🚀 Instruções para Deploy no Vercel

## Problema Identificado

O Vercel está configurado para fazer deploy do branch **`main`**, mas o código mais recente está no branch **`master`**.

## ✅ Solução

### Opção 1: Push Manual (Recomendado)

1. Abre o terminal
2. Executa os seguintes comandos:

```bash
cd /home/ubuntu/organizen
git push -u origin main --force
```

3. Se pedir credenciais do GitHub:
   - **Username:** organizencv
   - **Password:** Usa o teu Personal Access Token (não a senha do GitHub)

### Opção 2: Mudar Branch no Vercel

1. Acede a: https://vercel.com/bruno-duarte-s-projects/organizen/settings/git
2. Em **"Production Branch"**, muda de `main` para `master`
3. Guarda as alterações
4. Faz um novo deploy manual

## 📋 Verificação

Após fazer push ou mudar o branch:

1. Acede a: https://vercel.com/bruno-duarte-s-projects/organizen/deployments
2. Clica em **"Deploy"** (botão no canto superior direito)
3. Aguarda 2-3 minutos
4. Testa em: https://www.organizen.cv/login

## 🔍 Confirmação de Versão

Para confirmar que estás na versão mais recente:

- ✅ **Chat com multimédia** (envio de imagens/vídeos)
- ✅ **Sistema de mensagens** (assinatura automática)
- ✅ **Eventos** (navegação corrigida)
- ✅ **Tarefas** (timestamps de início/conclusão)

## ❓ Dúvidas

Se continuares a ter problemas, partilha:
1. Screenshot da página de deployments no Vercel
2. Último erro que aparece nos logs
