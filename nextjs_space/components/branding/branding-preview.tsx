
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Menu, Bell, User } from 'lucide-react';

interface BrandingPreviewProps {
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export function BrandingPreview({
  logoUrl,
  primaryColor = '#3B82F6',
  secondaryColor = '#8B5CF6',
  accentColor = '#10B981',
}: BrandingPreviewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Preview ao Vivo</h3>
      <Card>
        <CardContent className="p-0">
          {/* Header simulado */}
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative w-32 h-10">
                  <Image
                    src={logoUrl}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-32 h-10 bg-white/20 rounded flex items-center justify-center">
                  <span className="text-xs text-white/60">Sem logo</span>
                </div>
              )}
              <div className="flex gap-2">
                <Menu className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-white" />
              <User className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Conteúdo simulado */}
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Botões com cores corporativas:</h4>
              <div className="flex gap-2">
                <Button style={{ backgroundColor: primaryColor }} className="text-white">
                  Primária
                </Button>
                <Button style={{ backgroundColor: secondaryColor }} className="text-white">
                  Secundária
                </Button>
                <Button style={{ backgroundColor: accentColor }} className="text-white">
                  Destaque
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Card 1</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Card 2</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: secondaryColor }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Card 3</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
