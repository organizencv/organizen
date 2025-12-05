
'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';

interface ColorPickerSimpleProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow/orange
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#F97316', // orange
  '#14B8A6', // teal
  '#84CC16', // lime
  '#A855F7', // violet
  '#64748B', // slate
  '#DC2626', // red-600
  '#059669', // emerald
  '#D97706', // amber
];

export function ColorPickerSimple({ value, onChange, label }: ColorPickerSimpleProps) {
  const [customColor, setCustomColor] = useState(value);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            type="button"
          >
            <div
              className="h-5 w-5 rounded border"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-xs">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cores Predefinidas</label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      onChange(color);
                      setCustomColor(color);
                    }}
                    className="h-8 w-8 rounded border hover:scale-110 transition-transform relative"
                    style={{ backgroundColor: color }}
                  >
                    {value === color && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cor Personalizada</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#RRGGBB"
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onChange(customColor)}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
