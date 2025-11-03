
'use client';

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';
import { isValidHexColor, getContrastTextColor } from '@/lib/branding/validate-colors';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

export function ColorPicker({ label, value, onChange, presets }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultPresets = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];

  const colorPresets = presets || defaultPresets;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (isValidHexColor(newValue)) {
      onChange(newValue);
    }
  };

  const handlePresetClick = (color: string) => {
    setInputValue(color);
    onChange(color);
    setIsOpen(false);
  };

  const textColor = getContrastTextColor(value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="#3B82F6"
            className="pr-24"
          />
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 w-16 h-8 rounded border-2 border-border flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: isValidHexColor(inputValue) ? inputValue : '#fff' }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span
              className="text-xs font-mono font-bold"
              style={{ color: isValidHexColor(inputValue) ? textColor : '#000' }}
            >
              {isValidHexColor(inputValue) ? '✓' : '✗'}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-4 gap-2 p-3 border rounded-lg bg-white">
          {colorPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className="w-full aspect-square rounded border-2 hover:border-gray-400 transition-colors flex items-center justify-center"
              style={{ backgroundColor: preset, borderColor: preset === value ? '#000' : '#e5e7eb' }}
              onClick={() => handlePresetClick(preset)}
            >
              {preset === value && <Check className="h-5 w-5" style={{ color: getContrastTextColor(preset) }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
