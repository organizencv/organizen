#!/bin/bash
cd /home/ubuntu/organizen

echo "🔄 Fazendo push para GitHub..."
echo ""
echo "Branch atual: $(git branch --show-current)"
echo "Último commit: $(git log --oneline -1)"
echo ""

# Tenta fazer push
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso!"
    echo "Agora podes fazer redeploy no Vercel."
else
    echo "❌ Erro ao fazer push."
    echo ""
    echo "📝 Faz o seguinte manualmente:"
    echo "1. Abre o terminal"
    echo "2. cd /home/ubuntu/organizen"
    echo "3. git push -u origin main --force"
    echo ""
    echo "Se pedir credenciais, usa o teu token do GitHub"
fi
