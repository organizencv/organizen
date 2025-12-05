

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CURRENCIES = [
  { code: 'CVE', name: 'Escudo Cabo-verdiano', symbol: 'CVE' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥' },
  { code: 'CNY', name: 'Yuan Chinês', symbol: '¥' },
  { code: 'INR', name: 'Rúpia Indiana', symbol: '₹' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$' },
  { code: 'CAD', name: 'Dólar Canadense', symbol: 'C$' },
  { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: 'MX$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: 'ARS$' },
  { code: 'AOA', name: 'Kwanza Angolano', symbol: 'Kz' },
  { code: 'MZN', name: 'Metical Moçambicano', symbol: 'MT' },
];

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const selectedCurrency = CURRENCIES.find((c) => c.code === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="currency">Moeda</Label>
      <Select value={value || 'EUR'} onValueChange={onChange}>
        <SelectTrigger id="currency">
          <SelectValue placeholder="Selecione a moeda" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} - {currency.name} ({currency.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedCurrency && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span>Símbolo: {selectedCurrency.symbol}</span>
        </div>
      )}
    </div>
  );
}
