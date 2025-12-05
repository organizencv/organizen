#!/bin/bash

# Lista de arquivos a corrigir
files=(
  "app/api/branding/email-templates/route.ts"
  "app/api/branding/logo-url/route.ts"
  "app/api/branding/logo/route.ts"
  "app/api/branding/route.ts"
  "app/api/chat/conversations/route.ts"
  "app/api/profile/photo/url/route.ts"
  "app/api/settings/company/favicon-url/route.ts"
  "app/api/settings/company/pwa-icon-url/route.ts"
  "app/api/settings/company/route.ts"
  "app/api/settings/notifications/digest/route.ts"
  "app/api/settings/notifications/route.ts"
  "app/api/settings/regional/route.ts"
  "app/api/settings/security/route.ts"
  "app/api/testimonials/active/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Corrigindo: $file"
    
    # Remove todas as linhas "export const dynamic"
    grep -v "export const dynamic = 'force-dynamic';" "$file" > "${file}.tmp"
    
    # Adiciona apenas UMA vez após todos os imports
    awk '
      BEGIN { added = 0; in_imports = 1 }
      /^import / { print; next }
      /^$/ && in_imports && !added { 
        print ""
        print "export const dynamic = '\''force-dynamic'\'';"
        added = 1
        in_imports = 0
        next
      }
      { in_imports = 0; print }
    ' "${file}.tmp" > "$file"
    
    rm "${file}.tmp"
    echo "✓ Corrigido: $file"
  fi
done

echo "✓ Todos os arquivos corrigidos!"
