
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getTranslation, Language } from '@/lib/i18n';
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  LogIn, 
  LogOut,
  User,
  Calendar,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { pt, enUS, es, fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface AttendanceContentProps {
  language: Language;
}

interface ShiftWithAttendance {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  assignments: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: string;
    };
    attendance?: {
      id: string;
      status: string;
      clockInTime?: string;
      clockOutTime?: string;
      minutesLate?: number;
      minutesEarly?: number;
      totalMinutes?: number;
      justification?: string;
      notes?: string;
    };
  }[];
}

interface AttendanceSettings {
  allowManagerClockIn: boolean;
  allowSelfClockIn: boolean;
  requireGPS: boolean;
  maxGPSRadiusMeters: number;
  companyLatitude?: number;
  companyLongitude?: number;
  lateToleranceMinutes: number;
  earlyDepartureMinutes: number;
}

export default function AttendanceContent({ language }: AttendanceContentProps) {
  const { data: session } = useSession() || {};
  const [shifts, setShifts] = useState<ShiftWithAttendance[]>([]);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [justification, setJustification] = useState('');
  const [notes, setNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Estados para registo manual
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualShiftId, setManualShiftId] = useState<string>('');
  const [manualAssignmentId, setManualAssignmentId] = useState<string>('');
  const [manualClockInTime, setManualClockInTime] = useState('');
  const [manualClockOutTime, setManualClockOutTime] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [shiftsForDate, setShiftsForDate] = useState<ShiftWithAttendance[]>([]);

  const isManager = session?.user?.role && ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(session.user.role);

  const localeMap = {
    pt,
    en: enUS,
    es,
    fr
  };

  useEffect(() => {
    fetchSettings();
    fetchTodayShifts();
  }, []);

  // Buscar turnos quando a data manual mudar
  useEffect(() => {
    if (manualDate) {
      fetchShiftsForDate();
    }
  }, [manualDate]);

  const fetchShiftsForDate = async () => {
    try {
      const response = await fetch(`/api/shifts?date=${manualDate}`);
      if (response.ok) {
        const shiftsData = await response.json();
        
        // Buscar attendance para cada turno
        const shiftsWithAttendance = await Promise.all(
          shiftsData.map(async (shift: any) => {
            const assignmentsWithAttendance = await Promise.all(
              shift.assignments.map(async (assignment: any) => {
                try {
                  const attendanceResponse = await fetch(
                    `/api/attendance?shiftAssignmentId=${assignment.id}`
                  );
                  if (attendanceResponse.ok) {
                    const attendanceData = await attendanceResponse.json();
                    return {
                      ...assignment,
                      attendance: attendanceData[0] || null
                    };
                  }
                } catch (error) {
                  console.error('Error fetching attendance:', error);
                }
                return assignment;
              })
            );
            
            return {
              ...shift,
              assignments: assignmentsWithAttendance
            };
          })
        );
        
        setShiftsForDate(shiftsWithAttendance);
      }
    } catch (error) {
      console.error('Error fetching shifts for date:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/attendance-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchTodayShifts = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Buscar turnos de hoje
      const shiftsResponse = await fetch(`/api/shifts?date=${today}`);
      if (!shiftsResponse.ok) throw new Error('Failed to fetch shifts');
      
      const shiftsData = await shiftsResponse.json();
      
      // Para cada turno, buscar attendance dos assignments
      const shiftsWithAttendance = await Promise.all(
        shiftsData.map(async (shift: any) => {
          const assignmentsWithAttendance = await Promise.all(
            shift.assignments.map(async (assignment: any) => {
              try {
                const attendanceResponse = await fetch(
                  `/api/attendance?shiftAssignmentId=${assignment.id}`
                );
                if (attendanceResponse.ok) {
                  const attendanceData = await attendanceResponse.json();
                  return {
                    ...assignment,
                    attendance: attendanceData[0] || null
                  };
                }
              } catch (error) {
                console.error('Error fetching attendance:', error);
              }
              return assignment;
            })
          );
          
          return {
            ...shift,
            assignments: assignmentsWithAttendance
          };
        })
      );
      
      setShifts(shiftsWithAttendance);
    } catch (error) {
      console.error('Error fetching today shifts:', error);
      toast.error('Erro ao carregar turnos');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(getTranslation('locationDenied', language)));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(getTranslation('locationDenied', language)));
        }
      );
    });
  };

  const handleClockAction = async (
    assignmentId: string,
    action: 'clock_in' | 'clock_out'
  ) => {
    try {
      setProcessingAction(true);

      let location: { latitude: number; longitude: number } | null = null;

      // Obter localização se necessário
      if (settings?.requireGPS) {
        try {
          location = await getLocation();
        } catch (error) {
          toast.error(getTranslation('locationRequired', language));
          return;
        }
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftAssignmentId: assignmentId,
          action,
          latitude: location?.latitude,
          longitude: location?.longitude,
          notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registar ponto');
      }

      const actionName = action === 'clock_in' 
        ? getTranslation('clockedIn', language)
        : getTranslation('clockedOut', language);
      
      toast.success(actionName);
      fetchTodayShifts();
      setNotes('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMarkAbsent = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowJustifyModal(true);
  };

  const handleJustifyAbsence = async () => {
    if (!selectedAssignment) return;

    try {
      setProcessingAction(true);

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftAssignmentId: selectedAssignment.id,
          action: 'mark_absent',
          justification: justification.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao marcar falta');
      }

      toast.success('Falta registada');
      setShowJustifyModal(false);
      setSelectedAssignment(null);
      setJustification('');
      setNotes('');
      fetchTodayShifts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleManualAttendance = async () => {
    if (!manualAssignmentId || !manualClockInTime || !manualClockOutTime) {
      toast.error(getTranslation('bothTimesRequired', language));
      return;
    }

    try {
      setProcessingAction(true);

      // Construir datetime completo
      const clockInDateTime = new Date(`${manualDate}T${manualClockInTime}:00`);
      const clockOutDateTime = new Date(`${manualDate}T${manualClockOutTime}:00`);

      // Validar que saída é depois da entrada
      if (clockOutDateTime <= clockInDateTime) {
        toast.error('Hora de saída deve ser depois da hora de entrada');
        return;
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftAssignmentId: manualAssignmentId,
          action: 'manual_entry',
          clockInTime: clockInDateTime.toISOString(),
          clockOutTime: clockOutDateTime.toISOString(),
          notes: manualNotes.trim() || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registar ponto manual');
      }

      toast.success(getTranslation('manualAttendanceSuccess', language));
      
      // Limpar formulário
      setManualAssignmentId('');
      setManualClockInTime('');
      setManualClockOutTime('');
      setManualNotes('');
      setManualDate(format(new Date(), 'yyyy-MM-dd'));
      
      fetchTodayShifts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: getTranslation('pending', language), variant: 'outline' },
      PRESENT: { label: getTranslation('present', language), variant: 'default' },
      LATE: { label: getTranslation('late', language), variant: 'secondary' },
      ABSENT_JUSTIFIED: { label: getTranslation('absentJustified', language), variant: 'destructive' },
      ABSENT_UNJUSTIFIED: { label: getTranslation('absentUnjustified', language), variant: 'destructive' },
      HALF_DAY: { label: getTranslation('halfDay', language), variant: 'secondary' },
      EARLY_DEPARTURE: { label: getTranslation('earlyDeparture', language), variant: 'secondary' }
    };

    const config = statusMap[status] || statusMap.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LATE':
      case 'EARLY_DEPARTURE':
      case 'HALF_DAY':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'ABSENT_JUSTIFIED':
      case 'ABSENT_UNJUSTIFIED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{getTranslation('noShiftsToday', language)}</h3>
        <p className="text-muted-foreground">Não há turnos agendados para hoje</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs: Modo Automático vs Manual (apenas para managers) */}
      <Tabs defaultValue="automatic" className="space-y-6">
        {isManager && (
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="automatic" className="gap-2">
              <Clock className="h-4 w-4" />
              {getTranslation('automaticMode', language)}
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <User className="h-4 w-4" />
              {getTranslation('manualMode', language)}
            </TabsTrigger>
          </TabsList>
        )}

        {/* Tab: Modo Automático (Registo em Tempo Real) */}
        <TabsContent value="automatic" className="space-y-6">
          {/* Info sobre GPS */}
          {settings?.requireGPS && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {getTranslation('gpsValidation', language)}
                    </p>
                    <p className="text-sm text-blue-700">
                      A validação de localização está ativa. Certifique-se de estar dentro do raio de {settings.maxGPSRadiusMeters}m da empresa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Turnos */}
      {shifts.map((shift) => (
        <Card key={shift.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {shift.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {format(new Date(shift.startTime), "HH:mm", { locale: localeMap[language] })} - 
                  {format(new Date(shift.endTime), " HH:mm", { locale: localeMap[language] })}
                  {shift.description && ` • ${shift.description}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shift.assignments.map((assignment) => {
                const attendance = assignment.attendance;
                const canClockIn = !attendance || !attendance.clockInTime;
                const canClockOut = attendance && attendance.clockInTime && !attendance.clockOutTime;
                const isSelf = assignment.userId === session?.user?.id;
                const canManage = isManager || (isSelf && settings?.allowSelfClockIn);

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar>
                        <AvatarImage src={assignment.user.image || undefined} />
                        <AvatarFallback>
                          {assignment.user.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{assignment.user.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {assignment.user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{assignment.user.email}</p>
                        
                        {/* Status e detalhes */}
                        <div className="flex items-center gap-3 mt-2">
                          {attendance ? (
                            <>
                              {getStatusIcon(attendance.status)}
                              {getStatusBadge(attendance.status)}
                              
                              {attendance.clockInTime && (
                                <span className="text-xs text-muted-foreground">
                                  <LogIn className="h-3 w-3 inline mr-1" />
                                  {format(new Date(attendance.clockInTime), 'HH:mm', { locale: localeMap[language] })}
                                </span>
                              )}
                              
                              {attendance.clockOutTime && (
                                <span className="text-xs text-muted-foreground">
                                  <LogOut className="h-3 w-3 inline mr-1" />
                                  {format(new Date(attendance.clockOutTime), 'HH:mm', { locale: localeMap[language] })}
                                </span>
                              )}
                              
                              {attendance.minutesLate && attendance.minutesLate > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{attendance.minutesLate} min
                                </Badge>
                              )}
                            </>
                          ) : (
                            <>
                              {getStatusIcon('PENDING')}
                              {getStatusBadge('PENDING')}
                            </>
                          )}
                        </div>

                        {/* Justificação */}
                        {attendance?.justification && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <p className="font-medium">Justificação:</p>
                            <p className="text-muted-foreground">{attendance.justification}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de ação */}
                    {canManage && (
                      <div className="flex gap-2">
                        {canClockIn && (
                          <Button
                            size="sm"
                            onClick={() => handleClockAction(assignment.id, 'clock_in')}
                            disabled={processingAction}
                            className="gap-2"
                          >
                            <LogIn className="h-4 w-4" />
                            {getTranslation('clockIn', language)}
                          </Button>
                        )}
                        
                        {canClockOut && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleClockAction(assignment.id, 'clock_out')}
                            disabled={processingAction}
                            className="gap-2"
                          >
                            <LogOut className="h-4 w-4" />
                            {getTranslation('clockOut', language)}
                          </Button>
                        )}
                        
                        {isManager && !attendance && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleMarkAbsent(assignment)}
                            disabled={processingAction}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            {getTranslation('markAbsent', language)}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
        </TabsContent>

        {/* Tab: Modo Manual (Registo Retroativo - Apenas Managers) */}
        {isManager && (
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {getTranslation('manualRegistration', language)}
                </CardTitle>
                <CardDescription>
                  {getTranslation('manualAttendanceDescription', language)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="manual-date">
                    {getTranslation('selectDate', language)}
                  </Label>
                  <Input
                    id="manual-date"
                    type="date"
                    value={manualDate}
                    onChange={(e) => {
                      setManualDate(e.target.value);
                      setManualShiftId('');
                      setManualAssignmentId('');
                    }}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>

                {/* Seleção de Turno */}
                <div className="space-y-2">
                  <Label htmlFor="manual-shift">
                    {getTranslation('selectShiftForAttendance', language)}
                  </Label>
                  <Select
                    value={manualShiftId}
                    onValueChange={(value) => {
                      setManualShiftId(value);
                      setManualAssignmentId('');
                    }}
                  >
                    <SelectTrigger id="manual-shift">
                      <SelectValue placeholder={getTranslation('selectShiftForAttendance', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftsForDate.length === 0 ? (
                        <SelectItem value="no-shifts" disabled>
                          {getTranslation('noShiftsToday', language)}
                        </SelectItem>
                      ) : (
                        shiftsForDate.map(shift => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.title} ({format(new Date(shift.startTime), 'HH:mm', { locale: localeMap[language] })} - {format(new Date(shift.endTime), 'HH:mm', { locale: localeMap[language] })})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seleção de Funcionário */}
                <div className="space-y-2">
                  <Label htmlFor="manual-employee">
                    {getTranslation('selectEmployee', language)}
                  </Label>
                  <Select
                    value={manualAssignmentId}
                    onValueChange={setManualAssignmentId}
                    disabled={!manualShiftId}
                  >
                    <SelectTrigger id="manual-employee">
                      <SelectValue placeholder={
                        manualShiftId 
                          ? getTranslation('selectEmployee', language)
                          : getTranslation('selectShiftFirst', language)
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {manualShiftId && shiftsForDate
                        .filter(shift => shift.id === manualShiftId)
                        .flatMap(shift => 
                          shift.assignments.map(assignment => (
                            <SelectItem key={assignment.id} value={assignment.id}>
                              {assignment.user.name} ({assignment.user.email})
                            </SelectItem>
                          ))
                        )}
                    </SelectContent>
                  </Select>
                  {!manualShiftId && (
                    <p className="text-xs text-muted-foreground">
                      {getTranslation('selectShiftFirst', language)}
                    </p>
                  )}
                </div>

                {/* Grid de Horários */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hora de Entrada */}
                  <div className="space-y-2">
                    <Label htmlFor="manual-clock-in" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      {getTranslation('clockInTime', language)}
                    </Label>
                    <Input
                      id="manual-clock-in"
                      type="time"
                      value={manualClockInTime}
                      onChange={(e) => setManualClockInTime(e.target.value)}
                    />
                  </div>

                  {/* Hora de Saída */}
                  <div className="space-y-2">
                    <Label htmlFor="manual-clock-out" className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      {getTranslation('clockOutTime', language)}
                    </Label>
                    <Input
                      id="manual-clock-out"
                      type="time"
                      value={manualClockOutTime}
                      onChange={(e) => setManualClockOutTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="manual-notes">
                    {getTranslation('notes', language)}
                  </Label>
                  <Textarea
                    id="manual-notes"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Observações sobre o registo (opcional)"
                    rows={3}
                  />
                </div>

                {/* Botão de Submissão */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleManualAttendance}
                    disabled={processingAction || !manualAssignmentId || !manualClockInTime || !manualClockOutTime}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {getTranslation('registerManualAttendance', language)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Justificação */}
      <Dialog open={showJustifyModal} onOpenChange={setShowJustifyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTranslation('markAbsent', language)}</DialogTitle>
            <DialogDescription>
              Registar falta para {selectedAssignment?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="justification">{getTranslation('justification', language)}</Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Motivo da falta (opcional)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se não preencher, a falta será marcada como injustificada
              </p>
            </div>
            
            <div>
              <Label htmlFor="notes">{getTranslation('notes', language)}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionais (opcional)"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowJustifyModal(false);
                setSelectedAssignment(null);
                setJustification('');
                setNotes('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleJustifyAbsence}
              disabled={processingAction}
            >
              Confirmar Falta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
