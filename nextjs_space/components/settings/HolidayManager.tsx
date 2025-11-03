
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  description?: string;
}

export function HolidayManager() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    isRecurring: false,
    description: "",
  });

  const [importData, setImportData] = useState({
    country: "CV",
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const response = await fetch("/api/settings/holidays");
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error("Erro ao carregar feriados:", error);
      toast.error("Erro ao carregar feriados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.date) {
      toast.error("Nome e data são obrigatórios");
      return;
    }

    try {
      const url = editingId
        ? `/api/settings/holidays/${editingId}`
        : "/api/settings/holidays";
      
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingId
            ? "Feriado atualizado com sucesso"
            : "Feriado criado com sucesso"
        );
        await loadHolidays();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar feriado");
      }
    } catch (error) {
      console.error("Erro ao salvar feriado:", error);
      toast.error("Erro ao salvar feriado");
    }
  };

  const handleImport = async () => {
    if (!importData.country || !importData.year) {
      toast.error("Selecione o país e o ano");
      return;
    }

    setImporting(true);
    try {
      const response = await fetch("/api/settings/holidays/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `${result.imported} feriados importados com sucesso!`
        );
        await loadHolidays();
        setIsImportDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao importar feriados");
      }
    } catch (error) {
      console.error("Erro ao importar feriados:", error);
      toast.error("Erro ao importar feriados");
    } finally {
      setImporting(false);
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingId(holiday.id);
    setFormData({
      name: holiday.name,
      date: format(parseISO(holiday.date), "yyyy-MM-dd"),
      isRecurring: holiday.isRecurring,
      description: holiday.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este feriado?")) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/holidays/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Feriado deletado com sucesso");
        await loadHolidays();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao deletar feriado");
      }
    } catch (error) {
      console.error("Erro ao deletar feriado:", error);
      toast.error("Erro ao deletar feriado");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      date: "",
      isRecurring: false,
      description: "",
    });
  };

  const groupHolidaysByYear = () => {
    const grouped: Record<string, Holiday[]> = {};
    holidays.forEach((holiday) => {
      const year = format(parseISO(holiday.date), "yyyy");
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(holiday);
    });
    return grouped;
  };

  const groupedHolidays = groupHolidaysByYear();
  const years = Object.keys(groupedHolidays).sort().reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Feriados da Empresa</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os feriados para destacar no calendário e evitar agendamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Importar Feriados
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Feriado
          </Button>
        </div>
      </div>

      {holidays.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nenhum feriado cadastrado ainda
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Importar Feriados
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Manualmente
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {years.map((year) => (
            <div key={year}>
              <h4 className="text-md font-semibold mb-3">{year}</h4>
              <div className="grid gap-3">
                {groupedHolidays[year]
                  ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{holiday.name}</span>
                            {holiday.isRecurring && (
                              <Badge variant="secondary" className="text-xs">
                                Recorrente
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {format(parseISO(holiday.date), "dd 'de' MMMM", {
                                locale: ptBR,
                              })}
                            </span>
                            {holiday.description && (
                              <>
                                <span>•</span>
                                <span>{holiday.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(holiday)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(holiday.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Adicionar/Editar Feriado */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar" : "Adicionar"} Feriado
            </DialogTitle>
            <DialogDescription>
              Configure o nome e data do feriado
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome *</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Natal, Ano Novo, Dia da Independência"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Descrição
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional do feriado"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData({ ...formData, isRecurring: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="isRecurring" className="text-sm">
                Feriado recorrente (repete todos os anos)
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Importar Feriados */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Feriados Nacionais</DialogTitle>
            <DialogDescription>
              Importe automaticamente os feriados oficiais do país
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">País *</label>
              <Select
                value={importData.country}
                onValueChange={(value) =>
                  setImportData({ ...importData, country: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CV">🇨🇻 Cabo Verde</SelectItem>
                  <SelectItem value="PT">🇵🇹 Portugal</SelectItem>
                  <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ano *</label>
              <Select
                value={importData.year.toString()}
                onValueChange={(value) =>
                  setImportData({ ...importData, year: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium mb-1">ℹ️ Sobre a importação:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Feriados já existentes não serão duplicados</li>
                <li>Você pode editar ou remover feriados após importar</li>
                <li>Feriados recorrentes se repetem anualmente</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importando..." : "Importar Feriados"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
