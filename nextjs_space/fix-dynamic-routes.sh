#!/bin/bash

# Lista de arquivos de rotas API que precisam de export const dynamic = 'force-dynamic'
routes=(
  "app/api/chat/conversations/route.ts"
  "app/api/branding/email-templates/route.ts"
  "app/api/profile/photo/url/route.ts"
  "app/api/settings/company/favicon-url/route.ts"
  "app/api/settings/company/pwa-icon-url/route.ts"
  "app/api/settings/company/route.ts"
  "app/api/branding/logo-url/route.ts"
  "app/api/settings/notifications/route.ts"
  "app/api/settings/regional/route.ts"
  "app/api/settings/security/route.ts"
  "app/api/settings/notifications/digest/route.ts"
  "app/api/testimonials/active/route.ts"
  "app/api/branding/logo/route.ts"
  "app/api/branding/background/route.ts"
  "app/api/branding/background-url/route.ts"
  "app/api/branding/route.ts"
  "app/api/branding/public/route.ts"
)

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    # Verifica se já tem o export
    if ! grep -q "export const dynamic" "$route"; then
      # Adiciona após os imports
      sed -i "/^import/a \\
\\
export const dynamic = 'force-dynamic';" "$route"
      echo "✓ Adicionado dynamic export em: $route"
    else
      echo "○ Já existe dynamic export em: $route"
    fi
  fi
done

echo "✓ Concluído!"
