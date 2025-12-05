'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarIcon, Download, TrendingUp, Users, Clock, FileText, AlertCircle } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { getTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export default function ReportsAttendanceContent() {
  const { data: session } = useSession() || {};
  const [period, setPeriod] = useState('month');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const lang = ((session?.user as any)?.language || 'pt') as 'pt' | 'en' | 'es' | 'fr';
  const t = (key: any) => getTranslation(key, lang);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  // Removed auto-generation on filter change - user must click "Generate Report" button

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status}`);
      }
      const data = await response.json();
      // API returns array directly, not { departments: [] }
      const departments = Array.isArray(data) ? data : [];
      console.log('Departments fetched:', departments.length);
      setDepartments(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Erro ao carregar departamentos');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      // API returns array directly, not { users: [] }
      const users = Array.isArray(data) ? data : [];
      console.log('Users fetched:', users.length);
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar utilizadores');
    }
  };

  const getDateRange = () => {
    const now = new Date();
    
    switch (period) {
      case 'week':
        return {
          startDate: subDays(now, 7).toISOString(),
          endDate: now.toISOString(),
        };
      case 'month':
        return {
          startDate: startOfMonth(now).toISOString(),
          endDate: endOfMonth(now).toISOString(),
        };
      case 'quarter':
        return {
          startDate: subMonths(now, 3).toISOString(),
          endDate: now.toISOString(),
        };
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          return {
            startDate: customDateRange.from.toISOString(),
            endDate: customDateRange.to.toISOString(),
          };
        }
        return null;
      default:
        return {
          startDate: startOfMonth(now).toISOString(),
          endDate: endOfMonth(now).toISOString(),
        };
    }
  };

  const generateReport = async () => {
    const dateRange = getDateRange();
    if (!dateRange) return;

    setLoading(true);
    setShowPreview(false); // Reset preview state
    
    try {
      let queryParams = `startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      
      if (selectedDepartment !== 'all') {
        queryParams += `&departmentId=${selectedDepartment}`;
      }
      
      if (selectedUser !== 'all') {
        queryParams += `&userId=${selectedUser}`;
      }

      console.log('🔍 Requesting report with params:', queryParams);
      const response = await fetch(`/api/reports/attendance?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      console.log('📊 Report data received:', {
        summary: data.summary,
        userStatsCount: data.userStats?.length || 0,
        dailyBreakdownCount: data.dailyBreakdown?.length || 0
      });
      
      console.log('📊 Setting report data:', {
        summaryExists: !!data.summary,
        userStatsExists: !!data.userStats,
        dailyBreakdownExists: !!data.dailyBreakdown
      });
      setReportData(data);
      console.log('✅ reportData state updated. Now showing preview...');
      setShowPreview(true); // Show preview AFTER data is set
      console.log('✅ Preview state set to TRUE. Report should now be visible.');
      
      if (data.summary.totalExpectedDays === 0) {
        toast.error('Sem dados de ponto para o período selecionado. Verifique se há turnos criados e registos de ponto.');
      } else {
        toast.success(t('reportGenerated'));
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast.error('Erro ao gerar relatório');
      setShowPreview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const csvRows = [];
    csvRows.push(['Relatório de Ponto', '', '', '']);
    csvRows.push(['Período', `${reportData.period.startDate} - ${reportData.period.endDate}`, '', '']);
    csvRows.push(['', '', '', '']);
    csvRows.push(['Resumo Geral', '', '', '']);
    csvRows.push(['Dias Previstos', reportData.summary.totalExpectedDays, '', '']);
    csvRows.push(['Dias Trabalhados', reportData.summary.totalWorkedDays, '', '']);
    csvRows.push(['Taxa de Assiduidade', `${reportData.summary.attendanceRate}%`, '', '']);
    csvRows.push(['Taxa de Pontualidade', `${reportData.summary.punctualityRate}%`, '', '']);
    csvRows.push(['', '', '', '']);
    csvRows.push(['Utilizador', 'Dias Esperados', 'Dias Trabalhados', 'Taxa de Assiduidade (%)']);

    reportData.userStats.forEach((user: any) => {
      csvRows.push([
        user.userName,
        user.expectedDays,
        user.presentDays + user.lateDays,
        user.attendanceRate
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-ponto-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (!reportData) return;

    try {
      const response = await fetch('/api/reports/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: {
            summary: reportData.summary,
            userStats: reportData.userStats,
            dailyBreakdown: reportData.dailyBreakdown,
            period: reportData.period,
          },
          reportType: t('attendanceReport'),
          period: getPeriodLabel()
        })
      });

      const { html } = await response.json();
      
      // Criar uma nova janela e imprimir
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const handlePreview = () => {
    generateReport(); // generateReport() handles showPreview internally
  };

  const getPeriodLabel = () => {
    if (period === 'custom' && customDateRange.from && customDateRange.to) {
      return `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`;
    }
    return t(period);
  };

  // Prepare chart data
  const statusDistribution = reportData ? [
    { name: t('present'), value: reportData.summary?.onTimeDays || 0, color: '#10b981' },
    { name: t('late'), value: reportData.summary?.lateDays || 0, color: '#f59e0b' },
    { name: t('absentJustified'), value: reportData.summary?.absentJustifiedDays || 0, color: '#6b7280' },
    { name: t('absentUnjustified'), value: reportData.summary?.absentUnjustifiedDays || 0, color: '#ef4444' },
  ] : [];

  const dailyData = reportData?.dailyBreakdown?.map((day: any) => ({
    date: format(new Date(day.date), 'dd/MM'),
    [t('present')]: day.present || 0,
    [t('late')]: day.late || 0,
    [t('absences')]: (day.absentJustified || 0) + (day.absentUnjustified || 0),
  })) || [];
  
  console.log('📊 Chart Data Calculated:', {
    statusDistribution,
    dailyDataLength: dailyData.length,
    userStatsLength: reportData?.userStats?.length || 0
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('attendanceReports')}
          </CardTitle>
          <CardDescription>
            {t('reportsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('selectPeriod')}</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t('lastWeek')}</SelectItem>
                  <SelectItem value="month">{t('lastMonth')}</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="custom">{t('customPeriod')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Picker (shown only when custom) */}
            {period === 'custom' && (
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium">{t('selectDate')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from && customDateRange.to ? (
                        `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`
                      ) : (
                        <span>{t('selectDate')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: customDateRange.from, to: customDateRange.to }}
                      onSelect={(range: any) => setCustomDateRange({ from: range?.from, to: range?.to })}
                      locale={lang === 'pt' ? ptBR : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Department Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('selectDepartment')}</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder={t('allDepartments')} />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  <SelectItem value="all">{t('allDepartments')}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('selectUser')}</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder={t('allUsers')} />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  <SelectItem value="all">{t('allUsers')}</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePreview} disabled={loading}>
              {loading ? t('loadingReport') : 'Pré-visualizar'}
            </Button>
            <Button onClick={handleExportCSV} variant="outline" disabled={!reportData || loading}>
              <Download className="h-4 w-4 mr-2" />
              {t('exportCSV')}
            </Button>
            <Button onClick={handleExportPDF} variant="outline" disabled={!reportData || loading}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      )}

      {/* Report Data (only shown after preview) */}
      {(() => {
        console.log('🔍 Render check:', {
          loading,
          hasReportData: !!reportData,
          showPreview,
          shouldRender: !loading && reportData && showPreview
        });
        return null;
      })()}
      {!loading && reportData && showPreview && (
        <>
          {console.log('✅ RENDERING REPORT PREVIEW NOW!')}
          {console.log('📊 Full reportData:', JSON.stringify(reportData, null, 2))}
          {console.log('📊 Summary:', reportData.summary)}
          {console.log('📊 UserStats length:', reportData.userStats?.length)}
          {console.log('📊 DailyBreakdown length:', reportData.dailyBreakdown?.length)}
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('attendanceRate')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.summary?.attendanceRate ?? 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.summary?.totalWorkedDays ?? 0} / {reportData?.summary?.totalExpectedDays ?? 0} {t('days').toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('punctualityRate')}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.summary?.punctualityRate ?? 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.summary?.onTimeDays ?? 0} {t('onTimeDays').toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('hoursWorked')}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.summary?.totalHoursWorked ?? 0}h</div>
                <p className="text-xs text-muted-foreground">
                  de {reportData?.summary?.totalExpectedHours ?? 0}h {t('expectedHours').toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('coverageRate')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.summary?.coverageRate ?? 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {t('shiftsCompleted').toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t('attendanceStatus')}</CardTitle>
                <CardDescription>Distribuição por estado</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Breakdown Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dailyBreakdown')}</CardTitle>
                <CardDescription>Evolução diária</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey={t('present')} stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey={t('late')} stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey={t('absences')} stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* User Stats Table */}
          {reportData.userStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('userBreakdown')}</CardTitle>
                <CardDescription>Estatísticas por utilizador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">{t('name')}</th>
                        <th className="text-center py-2 px-4">{t('expectedDays')}</th>
                        <th className="text-center py-2 px-4">{t('workedDays')}</th>
                        <th className="text-center py-2 px-4">{t('onTimeDays')}</th>
                        <th className="text-center py-2 px-4">{t('lateDays')}</th>
                        <th className="text-center py-2 px-4">{t('attendanceRate')}</th>
                        <th className="text-center py-2 px-4">{t('punctualityRate')}</th>
                        <th className="text-center py-2 px-4">{t('hoursWorked')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.userStats.map((user: any) => (
                        <tr key={user.userId} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{user.userName}</td>
                          <td className="text-center py-2 px-4">{user.expectedDays}</td>
                          <td className="text-center py-2 px-4">{user.presentDays + user.lateDays}</td>
                          <td className="text-center py-2 px-4">{user.presentDays}</td>
                          <td className="text-center py-2 px-4">{user.lateDays}</td>
                          <td className="text-center py-2 px-4">
                            <span className={`font-medium ${user.attendanceRate >= 90 ? 'text-green-600' : user.attendanceRate >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                              {user.attendanceRate}%
                            </span>
                          </td>
                          <td className="text-center py-2 px-4">
                            <span className={`font-medium ${user.punctualityRate >= 90 ? 'text-green-600' : user.punctualityRate >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                              {user.punctualityRate}%
                            </span>
                          </td>
                          <td className="text-center py-2 px-4">{user.totalHoursWorked}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Data State */}
      {!loading && !reportData && showPreview && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noDataAvailable')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
