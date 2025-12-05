
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface ShiftSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  language: string;
}

export function ShiftSwapDialog({ open, onOpenChange, onSuccess, language }: ShiftSwapDialogProps) {
  const [loading, setLoading] = useState(false);
  const [originalShiftId, setOriginalShiftId] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalShiftId.trim()) {
      toast.error('Por favor, informe o ID do turno');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/shift-swap-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalShiftId,
          reason: reason.trim() || null
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar solicitação');
      }

      toast.success('Solicitação de troca de turno criada com sucesso!');
      setOriginalShiftId('');
      setReason('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating shift swap request:', error);
      toast.error('Erro ao criar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Troca de Turno</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para solicitar uma troca de turno
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="shift-id">ID do Turno *</Label>
              <input
                id="shift-id"
                type="text"
                value={originalShiftId}
                onChange={(e) => setOriginalShiftId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: shift_abc123"
                required
              />
              <p className="text-xs text-muted-foreground">
                Você pode encontrar o ID do turno na página de Turnos
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique brevemente o motivo da troca..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
