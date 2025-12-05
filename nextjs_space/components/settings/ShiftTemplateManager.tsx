
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
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { ColorPickerSimple } from "./ColorPickerSimple";

interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  color: string;
  description?: string;
}

export function ShiftTemplateManager() {
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    startTime: "09:00",
    endTime: "18:00",
    breakDuration: 60,
    color: "#3B82F6",
    description: "",
  });

  useEffect(() => {
    loadShiftTemplates();
  }, []);

  const loadShiftTemplates = async () => {
    try {
      const response = await fetch("/api/settings/shift-templates");
      if (response.ok) {
        const data = await response.json();
        setShiftTemplates(data);
      }
    } catch (error) {
      console.error("Erro ao carregar templates de turnos:", error);
      toast.error("Erro ao carregar templates de turnos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
      toast.error("Nome, horário de início e fim são obrigatórios");
      return;
    }

    try {
      const url = editingId
        ? `/api/settings/shift-templates/${editingId}`
        : "/api/settings/shift-templates";
      
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingId
            ? "Template de turno atualizado com sucesso"
            : "Template de turno criado com sucesso"
        );
        await loadShiftTemplates();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar template de turno");
      }
    } catch (error) {
      console.error("Erro ao salvar template de turno:", error);
      toast.error("Erro ao salvar template de turno");
    }
  };

  const handleEdit = (template: ShiftTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      breakDuration: template.breakDuration || 0,
      color: template.color,
      description: template.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este template de turno?")) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/shift-templates/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template de turno deletado com sucesso");
        await loadShiftTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao deletar template de turno");
      }
    } catch (error) {
      console.error("Erro ao deletar template de turno:", error);
      toast.error("Erro ao deletar template de turno");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      startTime: "09:00",
      endTime: "18:00",
      breakDuration: 60,
      color: "#3B82F6",
      description: "",
    });
  };

  const calculateDuration = (start: string, end: string, breakMin: number = 0) => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Turno cruza meia-noite
    
    const workMinutes = totalMinutes - breakMin;
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;
    
    return `${hours}h${minutes > 0 ? minutes + "min" : ""}`;
  };

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
          <h3 className="text-lg font-semibold">Templates de Turnos</h3>
          <p className="text-sm text-muted-foreground">
            Crie templates para facilitar o agendamento de turnos recorrentes
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Template
        </Button>
      </div>

      {shiftTemplates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nenhum template de turno ainda
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {shiftTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="h-10 w-10 rounded flex items-center justify-center"
                  style={{ backgroundColor: template.color + "20" }}
                >
                  <Clock 
                    className="h-5 w-5" 
                    style={{ color: template.color }} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {template.startTime} - {template.endTime}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {calculateDuration(template.startTime, template.endTime, template.breakDuration || 0)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.breakDuration ? `Intervalo: ${template.breakDuration} min` : "Sem intervalo"}
                    {template.description && ` • ${template.description}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar" : "Adicionar"} Template de Turno
            </DialogTitle>
            <DialogDescription>
              Configure o horário e duração do template de turno
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
                placeholder="Ex: Turno Manhã, Turno Noite, Plantão 12h"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Horário Início *
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Horário Fim *
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Duração do Intervalo (minutos)
              </label>
              <Input
                type="number"
                min="0"
                max="240"
                value={formData.breakDuration}
                onChange={(e) =>
                  setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 0 })
                }
                placeholder="Ex: 60"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe 0 para turno sem intervalo
              </p>
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
                placeholder="Descrição opcional do template"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <ColorPickerSimple
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
              />
            </div>

            {formData.startTime && formData.endTime && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Duração Total:</p>
                <p className="text-lg font-bold text-primary">
                  {calculateDuration(formData.startTime, formData.endTime, formData.breakDuration)}
                </p>
              </div>
            )}

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
    </div>
  );
}
