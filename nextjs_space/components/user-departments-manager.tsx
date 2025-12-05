
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Loader2, Plus, Trash2, Star, X, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
}

interface UserDepartment {
  id: string;
  departmentId: string;
  isPrimary: boolean;
  isActive: boolean;
  priority: number;
  role: string | null;
  availability: string | null;
  department: Department;
  createdAt: string;
  updatedAt: string;
}

interface UserDepartmentsManagerProps {
  userId: string;
  canEdit?: boolean;
}

export function UserDepartmentsManager({ userId, canEdit = false }: UserDepartmentsManagerProps) {
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form state para adicionar novo departamento
  const [newDepartment, setNewDepartment] = useState({
    departmentId: '',
    isPrimary: false,
    isActive: true,
    priority: 0,
    role: '',
    availability: ''
  });

  // Form state para editar departamento existente
  const [editingDepartment, setEditingDepartment] = useState<UserDepartment | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [userDeptsRes, allDeptsRes] = await Promise.all([
        fetch(`/api/users/${userId}/departments`),
        fetch('/api/departments')
      ]);

      if (userDeptsRes.ok) {
        const data = await userDeptsRes.json();
        setUserDepartments(data);
      }

      if (allDeptsRes.ok) {
        const data = await allDeptsRes.json();
        setAllDepartments(data);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.departmentId) {
      toast.error('Selecione um departamento');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/users/${userId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: newDepartment.departmentId,
          isPrimary: newDepartment.isPrimary,
          isActive: newDepartment.isActive,
          priority: newDepartment.priority,
          role: newDepartment.role || null,
          availability: newDepartment.availability || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar departamento');
      }

      toast.success('Departamento adicionado com sucesso!');
      setShowAddDialog(false);
      setNewDepartment({
        departmentId: '',
        isPrimary: false,
        isActive: true,
        priority: 0,
        role: '',
        availability: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Error adding department:', error);
      toast.error(error.message || 'Erro ao adicionar departamento');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/users/${userId}/departments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userDepartmentId: editingDepartment.id,
          isPrimary: editingDepartment.isPrimary,
          isActive: editingDepartment.isActive,
          priority: editingDepartment.priority,
          role: editingDepartment.role || null,
          availability: editingDepartment.availability || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar departamento');
      }

      toast.success('Departamento atualizado com sucesso!');
      setShowEditDialog(false);
      setEditingDepartment(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast.error(error.message || 'Erro ao atualizar departamento');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDepartment = async (userDepartmentId: string) => {
    if (!confirm('Tem certeza que deseja remover este departamento?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/users/${userId}/departments?userDepartmentId=${userDepartmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover departamento');
      }

      toast.success('Departamento removido com sucesso!');
      loadData();
    } catch (error: any) {
      console.error('Error removing department:', error);
      toast.error(error.message || 'Erro ao remover departamento');
    }
  };

  const handleSetPrimary = async (userDepartmentId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/departments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userDepartmentId,
          isPrimary: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao definir como primário');
      }

      toast.success('Departamento primário atualizado!');
      loadData();
    } catch (error: any) {
      console.error('Error setting primary:', error);
      toast.error(error.message || 'Erro ao definir como primário');
    }
  };

  const availableDepartments = allDepartments.filter(
    dept => !userDepartments.some(ud => ud.departmentId === dept.id)
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Departamentos
            </CardTitle>
            <CardDescription>
              Gerir departamentos atribuídos ao utilizador
            </CardDescription>
          </div>
          {canEdit && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Departamento</DialogTitle>
                  <DialogDescription>
                    Atribuir o utilizador a um departamento adicional
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento *</Label>
                    <Select
                      value={newDepartment.departmentId}
                      onValueChange={(value) =>
                        setNewDepartment({ ...newDepartment, departmentId: value })
                      }
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Papel no Departamento</Label>
                    <Input
                      id="role"
                      value={newDepartment.role}
                      onChange={(e) =>
                        setNewDepartment({ ...newDepartment, role: e.target.value })
                      }
                      placeholder="Ex: Apoio, Reforço, Auxílio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Disponibilidade</Label>
                    <Input
                      id="availability"
                      value={newDepartment.availability}
                      onChange={(e) =>
                        setNewDepartment({ ...newDepartment, availability: e.target.value })
                      }
                      placeholder="Ex: 50%, 20h/semana, Fins de semana"
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentual, horas ou período de disponibilidade
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={newDepartment.priority}
                      onChange={(e) =>
                        setNewDepartment({ ...newDepartment, priority: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Número maior = maior prioridade
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label>Departamento Primário</Label>
                      <p className="text-xs text-muted-foreground">
                        Principal departamento do utilizador
                      </p>
                    </div>
                    <Switch
                      checked={newDepartment.isPrimary}
                      onCheckedChange={(checked) =>
                        setNewDepartment({ ...newDepartment, isPrimary: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label>Ativo</Label>
                      <p className="text-xs text-muted-foreground">
                        Utilizador ativo neste departamento
                      </p>
                    </div>
                    <Switch
                      checked={newDepartment.isActive}
                      onCheckedChange={(checked) =>
                        setNewDepartment({ ...newDepartment, isActive: checked })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddDepartment} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      'Adicionar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {userDepartments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum departamento atribuído</p>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Departamento
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {userDepartments.map((ud) => (
              <div
                key={ud.id}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  ud.isActive ? 'bg-card' : 'bg-muted/50 opacity-60'
                } ${ud.isPrimary ? 'border-primary shadow-sm' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{ud.department.name}</h4>
                    {ud.isPrimary && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Primário
                      </Badge>
                    )}
                    {!ud.isActive && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {ud.role && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Papel: {ud.role}</span>
                      </div>
                    )}
                    {ud.availability && (
                      <div className="flex items-center gap-1">
                        <span>Disponibilidade: {ud.availability}</span>
                      </div>
                    )}
                    {ud.priority > 0 && (
                      <div className="flex items-center gap-1">
                        <span>Prioridade: {ud.priority}</span>
                      </div>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    {!ud.isPrimary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPrimary(ud.id)}
                        title="Definir como primário"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingDepartment(ud);
                        setShowEditDialog(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveDepartment(ud.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog de Edição */}
      {editingDepartment && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Departamento</DialogTitle>
              <DialogDescription>
                {editingDepartment.department.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Papel no Departamento</Label>
                <Input
                  id="edit-role"
                  value={editingDepartment.role || ''}
                  onChange={(e) =>
                    setEditingDepartment({ ...editingDepartment, role: e.target.value })
                  }
                  placeholder="Ex: Apoio, Reforço, Auxílio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-availability">Disponibilidade</Label>
                <Input
                  id="edit-availability"
                  value={editingDepartment.availability || ''}
                  onChange={(e) =>
                    setEditingDepartment({ ...editingDepartment, availability: e.target.value })
                  }
                  placeholder="Ex: 50%, 20h/semana, Fins de semana"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority">Prioridade</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  value={editingDepartment.priority}
                  onChange={(e) =>
                    setEditingDepartment({ ...editingDepartment, priority: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Departamento Primário</Label>
                </div>
                <Switch
                  checked={editingDepartment.isPrimary}
                  onCheckedChange={(checked) =>
                    setEditingDepartment({ ...editingDepartment, isPrimary: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Ativo</Label>
                </div>
                <Switch
                  checked={editingDepartment.isActive}
                  onCheckedChange={(checked) =>
                    setEditingDepartment({ ...editingDepartment, isActive: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingDepartment(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateDepartment} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
