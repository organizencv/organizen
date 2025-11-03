
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
import { Trash2, Edit, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ColorPickerSimple } from "./ColorPickerSimple";
import { IconPickerSimple } from "./IconPickerSimple";

interface EventType {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  isDefault: boolean;
}

export function EventTypeManager() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    icon: "Calendar",
    description: "",
    isDefault: false,
  });

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      const response = await fetch("/api/settings/event-types");
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error("Erro ao carregar tipos de eventos:", error);
      toast.error("Erro ao carregar tipos de eventos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const url = editingId
        ? `/api/settings/event-types/${editingId}`
        : "/api/settings/event-types";
      
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingId
            ? "Tipo de evento atualizado com sucesso"
            : "Tipo de evento criado com sucesso"
        );
        await loadEventTypes();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar tipo de evento");
      }
    } catch (error) {
      console.error("Erro ao salvar tipo de evento:", error);
      toast.error("Erro ao salvar tipo de evento");
    }
  };

  const handleEdit = (eventType: EventType) => {
    setEditingId(eventType.id);
    setFormData({
      name: eventType.name,
      color: eventType.color,
      icon: eventType.icon || "Calendar",
      description: eventType.description || "",
      isDefault: eventType.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este tipo de evento?")) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/event-types/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tipo de evento deletado com sucesso");
        await loadEventTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao deletar tipo de evento");
      }
    } catch (error) {
      console.error("Erro ao deletar tipo de evento:", error);
      toast.error("Erro ao deletar tipo de evento");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      color: "#3B82F6",
      icon: "Calendar",
      description: "",
      isDefault: false,
    });
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
          <h3 className="text-lg font-semibold">Tipos de Eventos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os tipos de eventos customizados para o calendário
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Tipo
        </Button>
      </div>

      {eventTypes.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nenhum tipo de evento customizado ainda
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Tipo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="h-10 w-10 rounded flex items-center justify-center"
                  style={{ backgroundColor: eventType.color + "20" }}
                >
                  <Calendar 
                    className="h-5 w-5" 
                    style={{ color: eventType.color }} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{eventType.name}</span>
                    {eventType.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Padrão
                      </Badge>
                    )}
                  </div>
                  {eventType.description && (
                    <p className="text-sm text-muted-foreground">
                      {eventType.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(eventType)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(eventType.id)}
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
              {editingId ? "Editar" : "Adicionar"} Tipo de Evento
            </DialogTitle>
            <DialogDescription>
              Configure o nome, cor e ícone para este tipo de evento
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
                placeholder="Ex: Reunião, Workshop, Treinamento"
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
                placeholder="Descrição opcional do tipo de evento"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cor *</label>
              <ColorPickerSimple
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="isDefault" className="text-sm">
                Definir como tipo padrão
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
    </div>
  );
}
