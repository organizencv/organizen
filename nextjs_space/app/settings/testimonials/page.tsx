
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/user-avatar';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Eye, 
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Testimonial {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  comment: string;
  rating: number;
  isActive: boolean;
  order: number | null;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  user?: User | null;
}

export default function TestimonialsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    jobTitle: '',
    company: '',
    comment: '',
    rating: 5,
    isActive: true,
    order: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      toast.error('Acesso negado. Apenas administradores podem gerir testemunhos.');
    } else {
      fetchTestimonials();
      fetchUsers();
    }
  }, [status, session, router]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/testimonials');
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data);
      } else {
        toast.error('Erro ao carregar testemunhos');
      }
    } catch (error) {
      console.error('Erro ao carregar testemunhos:', error);
      toast.error('Erro ao carregar testemunhos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleOpenDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        userId: testimonial.userId || '',
        name: testimonial.name,
        jobTitle: testimonial.jobTitle,
        company: testimonial.company,
        comment: testimonial.comment,
        rating: testimonial.rating,
        isActive: testimonial.isActive,
        order: testimonial.order?.toString() || '',
      });
    } else {
      setEditingTestimonial(null);
      setFormData({
        userId: '',
        name: '',
        jobTitle: '',
        company: '',
        comment: '',
        rating: 5,
        isActive: true,
        order: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    setFormData({
      userId: '',
      name: '',
      jobTitle: '',
      company: '',
      comment: '',
      rating: 5,
      isActive: true,
      order: '',
    });
  };

  const handleSave = async () => {
    // Validações
    if (!formData.userId) {
      toast.error('Selecione um colaborador');
      return;
    }

    if (!formData.name || !formData.jobTitle || !formData.company || !formData.comment) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        userId: formData.userId || null,
        order: formData.order ? parseInt(formData.order) : null,
      };

      const url = editingTestimonial
        ? `/api/testimonials/${editingTestimonial.id}`
        : '/api/testimonials';
      
      const method = editingTestimonial ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          editingTestimonial
            ? 'Testemunho atualizado com sucesso'
            : 'Testemunho criado com sucesso'
        );
        handleCloseDialog();
        fetchTestimonials();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar testemunho');
      }
    } catch (error) {
      console.error('Erro ao salvar testemunho:', error);
      toast.error('Erro ao salvar testemunho');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este testemunho?')) {
      return;
    }

    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Testemunho excluído com sucesso');
        fetchTestimonials();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir testemunho');
      }
    } catch (error) {
      console.error('Erro ao excluir testemunho:', error);
      toast.error('Erro ao excluir testemunho');
    }
  };

  const toggleActive = async (testimonial: Testimonial) => {
    try {
      const response = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !testimonial.isActive }),
      });

      if (response.ok) {
        toast.success(
          testimonial.isActive
            ? 'Testemunho ocultado da página de login'
            : 'Testemunho ativado na página de login'
        );
        fetchTestimonials();
      } else {
        toast.error('Erro ao atualizar testemunho');
      }
    } catch (error) {
      console.error('Erro ao atualizar testemunho:', error);
      toast.error('Erro ao atualizar testemunho');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Testemunhos</h1>
          <p className="text-muted-foreground">
            Gerir testemunhos exibidos na página de login
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Testemunho
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum testemunho criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie testemunhos para exibir na página de login
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Testemunho
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={testimonial.user || { name: testimonial.name, email: null, image: null }}
                      size="lg"
                    />
                    <div>
                      <CardTitle className="text-base">{testimonial.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {testimonial.jobTitle}
                      </CardDescription>
                    </div>
                  </div>
                  {testimonial.isActive ? (
                    <Badge variant="default" className="ml-2">
                      <Eye className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-2">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {testimonial.company}
                </p>
                <p className="text-sm mb-3 line-clamp-3">
                  &quot;{testimonial.comment}&quot;
                </p>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(testimonial)}
                    className="flex-1"
                  >
                    {testimonial.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(testimonial)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(testimonial.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? 'Editar Testemunho' : 'Novo Testemunho'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do testemunho
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">Colaborador *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => {
                  const selectedUser = users.find(u => u.id === value);
                  setFormData({ 
                    ...formData, 
                    userId: value,
                    name: selectedUser?.name || '',
                    // Preencher automaticamente o nome quando selecionar o usuário
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador que está dando o testemunho" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={user} size="sm" />
                        <span>{user.name || user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A foto de perfil do colaborador será exibida automaticamente no testemunho
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Exibido *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="João Silva"
              />
              <p className="text-xs text-muted-foreground">
                Este é o nome que aparecerá no testemunho (pode ser diferente do nome do colaborador)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jobTitle">Cargo *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Gerente de Operações"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Empresa XYZ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">Comentário *</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="O OrganiZen transformou a forma como gerimos a nossa equipa..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rating">Avaliação</Label>
              <Select
                value={formData.rating.toString()}
                onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ (5 estrelas)</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ (4 estrelas)</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ (3 estrelas)</SelectItem>
                  <SelectItem value="2">⭐⭐ (2 estrelas)</SelectItem>
                  <SelectItem value="1">⭐ (1 estrela)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order">Ordem (opcional)</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                placeholder="1, 2, 3..."
              />
              <p className="text-xs text-muted-foreground">
                Define a ordem de exibição. Deixe em branco para ordem aleatória.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Exibir na página de login</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
