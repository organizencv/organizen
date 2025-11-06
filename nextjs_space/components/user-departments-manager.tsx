
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Plus, Edit, Trash2, Star, Building2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/hooks/use-language'
import { getTranslation } from '@/lib/i18n'

interface UserDepartment {
  id: string
  userId: string
  departmentId: string
  department: {
    id: string
    name: string
  }
  team?: {
    id: string
    name: string
  } | null
  role: string | null
  isActive: boolean
  isPrimary: boolean
  availability: number
  priority: number
  createdAt: string
  updatedAt: string
}

interface Department {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  departmentId: string
}

interface UserDepartmentsManagerProps {
  userId: string
  companyId: string
  canEdit?: boolean
}

export function UserDepartmentsManager({
  userId,
  companyId,
  canEdit = false,
}: UserDepartmentsManagerProps) {
  const language = useLanguage()
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([])
  const [allDepartments, setAllDepartments] = useState<Department[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<UserDepartment | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    departmentId: '',
    teamId: '',
    role: '',
    availability: 100,
    priority: 0,
    isPrimary: false,
  })

  useEffect(() => {
    fetchUserDepartments()
    fetchAllDepartments()
    fetchAllTeams()
  }, [userId])

  const fetchUserDepartments = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/departments`)
      if (response.ok) {
        const data = await response.json()
        setUserDepartments(data)
      }
    } catch (error) {
      console.error('Erro ao buscar departamentos do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllDepartments = async () => {
    try {
      const response = await fetch(`/api/departments?companyId=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setAllDepartments(data)
      }
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error)
    }
  }

  const fetchAllTeams = async () => {
    try {
      const response = await fetch(`/api/teams?companyId=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setAllTeams(data)
      }
    } catch (error) {
      console.error('Erro ao buscar equipas:', error)
    }
  }

  const getAvailableTeams = (departmentId: string) => {
    return allTeams.filter(team => team.departmentId === departmentId)
  }

  const handleAddDepartment = async () => {
    if (!formData.departmentId) {
      toast.error(getTranslation('selectDepartment', language))
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(getTranslation('departmentAddedSuccess', language))
        fetchUserDepartments()
        setIsAddDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || getTranslation('errorAddingDepartment', language))
      }
    } catch (error) {
      console.error('Erro ao adicionar departamento:', error)
      toast.error(getTranslation('errorAddingDepartment', language))
    }
  }

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return

    try {
      const response = await fetch(
        `/api/users/${userId}/departments/${selectedDepartment.departmentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

      if (response.ok) {
        toast.success(getTranslation('departmentUpdatedSuccess', language))
        fetchUserDepartments()
        setIsEditDialogOpen(false)
        setSelectedDepartment(null)
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || getTranslation('errorUpdatingDepartment', language))
      }
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error)
      toast.error(getTranslation('errorUpdatingDepartment', language))
    }
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm(getTranslation('confirmRemoveDepartment', language))) return

    try {
      const response = await fetch(
        `/api/users/${userId}/departments/${departmentId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success(getTranslation('departmentRemovedSuccess', language))
        fetchUserDepartments()
      } else {
        const error = await response.json()
        toast.error(error.error || getTranslation('errorRemovingDepartment', language))
      }
    } catch (error) {
      console.error('Erro ao remover departamento:', error)
      toast.error(getTranslation('errorRemovingDepartment', language))
    }
  }

  const openEditDialog = (department: UserDepartment) => {
    setSelectedDepartment(department)
    setFormData({
      departmentId: department.departmentId,
      teamId: department.team?.id || '',
      role: department.role || '',
      availability: department.availability,
      priority: department.priority,
      isPrimary: department.isPrimary,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      departmentId: '',
      teamId: '',
      role: '',
      availability: 100,
      priority: 0,
      isPrimary: false,
    })
  }

  const getRoleBadgeColor = (role: string | null) => {
    if (!role) return 'bg-gray-500'
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500'
      case 'MANAGER':
        return 'bg-blue-500'
      case 'SUPERVISOR':
        return 'bg-green-500'
      case 'STAFF':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 0:
        return getTranslation('priorityLow', language)
      case 1:
        return getTranslation('priorityMedium', language)
      case 2:
        return getTranslation('priorityHigh', language)
      case 3:
        return getTranslation('priorityCritical', language)
      default:
        return getTranslation('priorityLow', language)
    }
  }

  if (loading) {
    return <div className="text-center py-4">{getTranslation('loading', language)}...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {getTranslation('departments', language)}
        </h3>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                {getTranslation('addDepartment', language)}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{getTranslation('addDepartmentToUser', language)}</DialogTitle>
                <DialogDescription>
                  {getTranslation('addDepartmentDescription', language)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{getTranslation('department', language)}</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: value, teamId: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={getTranslation('selectDepartment', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {allDepartments
                        .filter(
                          (dept) =>
                            !userDepartments.find(
                              (ud) => ud.departmentId === dept.id
                            )
                        )
                        .map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{getTranslation('role', language)} ({getTranslation('optional', language)})</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={getTranslation('selectRole', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">{getTranslation('staff', language)}</SelectItem>
                      <SelectItem value="SUPERVISOR">{getTranslation('supervisor', language)}</SelectItem>
                      <SelectItem value="MANAGER">{getTranslation('manager', language)}</SelectItem>
                      <SelectItem value="ADMIN">{getTranslation('admin', language)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.departmentId && (
                  <div>
                    <Label>{getTranslation('team', language)} ({getTranslation('optional', language)})</Label>
                    <Select
                      value={formData.teamId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, teamId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={getTranslation('selectTeam', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTeams(formData.departmentId).map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>{getTranslation('primaryDepartment', language)}</Label>
                  <Switch
                    checked={formData.isPrimary}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPrimary: checked })
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddDepartment} className="flex-1">
                    {getTranslation('add', language)}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    {getTranslation('cancel', language)}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {userDepartments.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          {getTranslation('noDepartmentsAssigned', language)}
        </Card>
      ) : (
        <div className="grid gap-3">
          {userDepartments.map((userDept) => (
            <Card key={userDept.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{userDept.department.name}</h4>
                    {userDept.isPrimary && (
                      <Badge variant="default" className="bg-amber-500">
                        <Star className="h-3 w-3 mr-1" />
                        {getTranslation('primary', language)}
                      </Badge>
                    )}
                    {!userDept.isActive && (
                      <Badge variant="secondary">{getTranslation('inactive', language)}</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    {userDept.role && (
                      <Badge className={getRoleBadgeColor(userDept.role)}>
                        {t(userDept.role.toLowerCase())}
                      </Badge>
                    )}
                    {userDept.team && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {userDept.team.name}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {getTranslation('availability', language)}: {userDept.availability}%
                    </Badge>
                    <Badge variant="outline">
                      {getPriorityLabel(userDept.priority)}
                    </Badge>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(userDept)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteDepartment(userDept.departmentId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getTranslation('editDepartmentAssignment', language)}</DialogTitle>
            <DialogDescription>
              {selectedDepartment?.department.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{getTranslation('role', language)}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={getTranslation('selectRole', language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{getTranslation('useGlobalRole', language)}</SelectItem>
                  <SelectItem value="STAFF">{getTranslation('staff', language)}</SelectItem>
                  <SelectItem value="SUPERVISOR">{getTranslation('supervisor', language)}</SelectItem>
                  <SelectItem value="MANAGER">{getTranslation('manager', language)}</SelectItem>
                  <SelectItem value="ADMIN">{getTranslation('admin', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDepartment && (
              <div>
                <Label>{getTranslation('team', language)}</Label>
                <Select
                  value={formData.teamId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teamId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={getTranslation('selectTeam', language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{getTranslation('noTeam', language)}</SelectItem>
                    {getAvailableTeams(selectedDepartment.departmentId).map(
                      (team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>
                {getTranslation('availability', language)}: {formData.availability}%
              </Label>
              <Slider
                value={[formData.availability]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, availability: value })
                }
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>{getTranslation('priority', language)}</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{getTranslation('priorityLow', language)}</SelectItem>
                  <SelectItem value="1">{getTranslation('priorityMedium', language)}</SelectItem>
                  <SelectItem value="2">{getTranslation('priorityHigh', language)}</SelectItem>
                  <SelectItem value="3">{getTranslation('priorityCritical', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>{getTranslation('primaryDepartment', language)}</Label>
              <Switch
                checked={formData.isPrimary}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPrimary: checked })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateDepartment} className="flex-1">
                {getTranslation('save', language)}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedDepartment(null)
                }}
                className="flex-1"
              >
                {getTranslation('cancel', language)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
