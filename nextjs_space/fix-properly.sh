#!/bin/bash

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
    echo "Reordenando: $file"
    
    # Extrair todos os imports e o resto do arquivo
    awk '
      BEGIN { in_imports = 1; imports = ""; rest = "" }
      
      # Se encontrar a linha dynamic, ignora
      /^export const dynamic/ { next }
      
      # Se for import, armazena
      /^import / { 
        imports = imports $0 "\n"
        next 
      }
      
      # Primeira linha não-import e não-vazia
      !/^import / && !/^export const dynamic/ && !/^$/ && in_imports {
        in_imports = 0
        # Adiciona imports, depois dynamic, depois esta linha
        printf "%s\nexport const dynamic = '\''force-dynamic'\'';\n\n%s\n", imports, $0
        next
      }
      
      # Linhas vazias no início (entre imports)
      /^$/ && in_imports { 
        imports = imports $0 "\n"
        next 
      }
      
      # Todo o resto
      !in_imports { print }
    ' "$file" > "${file}.tmp"
    
    mv "${file}.tmp" "$file"
    echo "✓ Reordenado: $file"
  fi
done

echo "✓ Concluído!"
