
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarIcon, Download, TrendingUp, Users, MessageSquare, Calendar as CalendarIconLucide, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { getTranslation } from '@/lib/i18n';

export default function ReportsContent() {
  const { data: session } = useSession() || {};
  const [period, setPeriod] = useState('month');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [overviewData, setOverviewData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [productivityData, setProductivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const lang = (session?.user as any)?.language || 'pt';
  const t = (key: string) => getTranslation(key as any, lang);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    fetchReports();
  }, [period, customDateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let queryParams = `period=${period}`;
      
      if (period === 'custom' && customDateRange.from && customDateRange.to) {
        queryParams += `&startDate=${customDateRange.from.toISOString()}&endDate=${customDateRange.to.toISOString()}`;
      }

      const [overviewRes, timelineRes, productivityRes] = await Promise.all([
        fetch(`/api/reports/overview?${queryParams}`),
        fetch(`/api/reports/tasks-timeline?${queryParams}`),
        fetch(`/api/reports/user-productivity?${queryParams}`)
      ]);

      const overview = await overviewRes.json();
      const timeline = await timelineRes.json();
      const productivity = await productivityRes.json();

      setOverviewData(overview);
      setTimelineData(timeline.timeline || []);
      setProductivityData(productivity.productivity || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const reportData = {
        overview: overviewData,
        timeline: timelineData,
        productivity: productivityData
      };

      const response = await fetch('/api/reports/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData,
          reportType: t('reports'),
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
    }
  };

  const getPeriodLabel = () => {
    if (period === 'custom' && customDateRange.from && customDateRange.to) {
      return `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`;
    }
    return t(period);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">{t('loading')}</div>
      </div>
    );
  }

  // Dados para gráfico de pizza de tarefas
  const tasksPieData = overviewData?.tasks ? [
    { name: t('completed'), value: overviewData.tasks.completed },
    { name: t('inProgress'), value: overviewData.tasks.inProgress },
    { name: t('pending'), value: overviewData.tasks.pending }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('reports')}</h1>
          <p className="text-muted-foreground">{t('reportsDesc')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('today')}</SelectItem>
              <SelectItem value="week">{t('lastWeek')}</SelectItem>
              <SelectItem value="month">{t('lastMonth')}</SelectItem>
              <SelectItem value="year">{t('lastYear')}</SelectItem>
              <SelectItem value="custom">{t('customPeriod')}</SelectItem>
            </SelectContent>
          </Select>

          {period === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, 'dd/MM/yy')} - {format(customDateRange.to, 'dd/MM/yy')}
                      </>
                    ) : (
                      format(customDateRange.from, 'dd/MM/yy')
                    )
                  ) : (
                    t('selectDate')
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: customDateRange.from, to: customDateRange.to }}
                  onSelect={(range: any) => setCustomDateRange(range || { from: undefined, to: undefined })}
                  locale={lang === 'pt' ? ptBR : enUS}
                />
              </PopoverContent>
            </Popover>
          )}

          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('exportPDF')}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalTasks')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.overview?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.overview?.completionRate}% {t('completed')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalMessages')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.overview?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.messages?.unread || 0} {t('unread')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalShifts')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.overview?.totalShifts || 0}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.overview?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{t('activeUsers')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Task Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tasksByStatus')}</CardTitle>
            <CardDescription>{t('taskDistribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tasksPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tasksPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tasksTimeline')}</CardTitle>
            <CardDescription>{t('tasksOverTime')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, 'dd/MM');
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, 'dd/MM/yyyy');
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name={t('completed')} />
                <Line type="monotone" dataKey="inProgress" stroke="#f59e0b" name={t('inProgress')} />
                <Line type="monotone" dataKey="pending" stroke="#ef4444" name={t('pending')} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Productivity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('userProductivity')}</CardTitle>
          <CardDescription>{t('topPerformers')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completedTasks" fill="#2563eb" name={t('completedTasks')} />
              <Bar dataKey="totalTasks" fill="#94a3b8" name={t('totalTasks')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Productivity Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detailedProductivity')}</CardTitle>
          <CardDescription>{t('userStats')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">{t('name')}</th>
                  <th className="text-right p-2">{t('totalTasks')}</th>
                  <th className="text-right p-2">{t('completedTasks')}</th>
                  <th className="text-right p-2">{t('messagesSent')}</th>
                  <th className="text-right p-2">{t('shiftsCompleted')}</th>
                  <th className="text-right p-2">{t('completionRate')}</th>
                </tr>
              </thead>
              <tbody>
                {productivityData.map((user, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2">{user.name}</td>
                    <td className="text-right p-2">{user.totalTasks}</td>
                    <td className="text-right p-2">{user.completedTasks}</td>
                    <td className="text-right p-2">{user.messagesSent}</td>
                    <td className="text-right p-2">{user.shiftsCompleted}</td>
                    <td className="text-right p-2 font-semibold">{user.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
    }
