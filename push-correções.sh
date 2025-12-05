#!/bin/bash

# Script para fazer push das correções para o GitHub
# Execute: bash push-correções.sh

cd /home/ubuntu/organizen

echo "====================================="
echo "   PUSH PARA GITHUB - OrganiZen"
echo "====================================="
echo ""
echo "📦 Commits locais a enviar:"
echo ""
git log origin/main..HEAD --oneline
echo ""
echo "====================================="
echo ""

# Tentar push
echo "🚀 Enviando commits para o GitHub..."
echo ""

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "====================================="
    echo "✅ PUSH REALIZADO COM SUCESSO!"
    echo "====================================="
    echo ""
    echo "Próximos passos:"
    echo "1. Vá para a Vercel: https://vercel.com/bruno-duarte-s-projects/organizenapp"
    echo "2. Vá para Deployments"
    echo "3. Clique em 'Redeploy' no último deployment"
    echo ""
    echo "Ou aguarde alguns segundos - a Vercel pode fazer deploy automático!"
    echo ""
else
    echo ""
    echo "====================================="
    echo "❌ ERRO NO PUSH"
    echo "====================================="
    echo ""
    echo "Se pedir credenciais:"
    echo "- Username: organizencv (ou seu username GitHub)"
    echo "- Password: SEU_PERSONAL_ACCESS_TOKEN"
    echo ""
    echo "Como obter um Personal Access Token:"
    echo "1. https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Marque: repo (todos)"
    echo "4. Generate token"
    echo "5. Copie o token e use como password"
    echo ""
    echo "Ou execute novamente: bash push-correções.sh"
    echo ""
fi
