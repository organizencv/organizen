
/**
 * Template HTML para PDFs com branding corporativo
 */

interface BrandingConfig {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  companyName?: string;
}

interface ReportData {
  overview?: any;
  timeline?: any[];
  productivity?: any[];
}

export function generateBrandedPDFHTML(
  reportData: ReportData,
  reportType: string,
  period: string,
  branding: BrandingConfig,
  translations: any
): string {
  const { logoUrl, primaryColor, secondaryColor, accentColor, companyName } = branding;
  
  // Cores padrão se não houver customização
  const primary = primaryColor || '#2563eb';
  const secondary = secondaryColor || '#10b981';
  const accent = accentColor || '#f59e0b';

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportType} - ${companyName || 'OrganiZen'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 40px;
      background: #ffffff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primary};
      margin-bottom: 30px;
    }

    .logo-section {
      flex: 1;
    }

    .logo {
      max-width: 180px;
      max-height: 80px;
      object-fit: contain;
    }

    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: ${primary};
    }

    .header-info {
      text-align: right;
      flex: 1;
    }

    .report-title {
      font-size: 20px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
    }

    .report-subtitle {
      font-size: 14px;
      color: #6b7280;
    }

    .metadata {
      background: linear-gradient(135deg, ${primary}15 0%, ${secondary}15 100%);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
    }

    .metadata-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .metadata-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: ${primary};
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${primary}30;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: all 0.3s;
    }

    .stat-card:hover {
      border-color: ${primary};
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: ${primary};
      margin-bottom: 5px;
    }

    .stat-description {
      font-size: 13px;
      color: #6b7280;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: #ffffff;
    }

    thead {
      background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%);
      color: #ffffff;
    }

    th {
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }

    tbody tr:hover {
      background-color: #f9fafb;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-success {
      background: ${secondary}20;
      color: ${secondary};
    }

    .badge-warning {
      background: ${accent}20;
      color: ${accent};
    }

    .badge-info {
      background: ${primary}20;
      color: ${primary};
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    .footer-brand {
      font-weight: 600;
      color: ${primary};
      margin-top: 10px;
    }

    .chart-placeholder {
      background: linear-gradient(135deg, ${primary}10 0%, ${secondary}10 100%);
      border: 2px dashed ${primary}40;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      color: #6b7280;
      margin: 20px 0;
    }

    @media print {
      body {
        padding: 20px;
      }

      .stat-card {
        break-inside: avoid;
      }

      .section {
        break-inside: avoid;
      }

      table {
        page-break-inside: auto;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      thead {
        display: table-header-group;
      }

      tfoot {
        display: table-footer-group;
      }
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="logo-section">
      ${logoUrl 
        ? `<img src="${logoUrl}" alt="${companyName || 'Logo'}" class="logo" />` 
        : `<div class="company-name">${companyName || 'OrganiZen'}</div>`
      }
    </div>
    <div class="header-info">
      <div class="report-title">${reportType}</div>
      <div class="report-subtitle">${translations.generatedReport || 'Relatório Gerado'}</div>
    </div>
  </div>

  <!-- METADATA -->
  <div class="metadata">
    <div class="metadata-item">
      <div class="metadata-label">${translations.period || 'Período'}</div>
      <div class="metadata-value">${period}</div>
    </div>
    <div class="metadata-item">
      <div class="metadata-label">${translations.generatedAt || 'Gerado em'}</div>
      <div class="metadata-value">${new Date().toLocaleString('pt-PT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</div>
    </div>
    ${companyName ? `
    <div class="metadata-item">
      <div class="metadata-label">${translations.company || 'Empresa'}</div>
      <div class="metadata-value">${companyName}</div>
    </div>
    ` : ''}
  </div>

  <!-- OVERVIEW STATS -->
  ${reportData.overview ? `
  <div class="section">
    <h2 class="section-title">${translations.overview || 'Visão Geral'}</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${translations.totalTasks || 'Total de Tarefas'}</div>
        <div class="stat-value">${reportData.overview.overview?.totalTasks || 0}</div>
        <div class="stat-description">
          <span class="badge badge-success">${reportData.overview.tasks?.completed || 0} ${translations.completed || 'concluídas'}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">${translations.completionRate || 'Taxa de Conclusão'}</div>
        <div class="stat-value">${reportData.overview.overview?.completionRate || 0}%</div>
        <div class="stat-description">${translations.ofTotalTasks || 'do total de tarefas'}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">${translations.totalMessages || 'Total de Mensagens'}</div>
        <div class="stat-value">${reportData.overview.overview?.totalMessages || 0}</div>
        <div class="stat-description">
          <span class="badge badge-warning">${reportData.overview.messages?.unread || 0} ${translations.unread || 'não lidas'}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">${translations.totalUsers || 'Total de Utilizadores'}</div>
        <div class="stat-value">${reportData.overview.overview?.totalUsers || 0}</div>
        <div class="stat-description">${translations.activeUsers || 'utilizadores ativos'}</div>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- PRODUCTIVITY TABLE -->
  ${reportData.productivity && reportData.productivity.length > 0 ? `
  <div class="section">
    <h2 class="section-title">${translations.userProductivity || 'Produtividade por Utilizador'}</h2>
    <table>
      <thead>
        <tr>
          <th>${translations.name || 'Nome'}</th>
          <th class="text-right">${translations.totalTasks || 'Total Tarefas'}</th>
          <th class="text-right">${translations.completedTasks || 'Tarefas Concluídas'}</th>
          <th class="text-right">${translations.messagesSent || 'Mensagens Enviadas'}</th>
          <th class="text-right">${translations.shiftsCompleted || 'Turnos Completos'}</th>
          <th class="text-right">${translations.completionRate || 'Taxa'}</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.productivity.map(user => `
        <tr>
          <td>${user.name}</td>
          <td class="text-right">${user.totalTasks}</td>
          <td class="text-right"><strong>${user.completedTasks}</strong></td>
          <td class="text-right">${user.messagesSent}</td>
          <td class="text-right">${user.shiftsCompleted}</td>
          <td class="text-right">
            <span class="badge ${user.completionRate >= 80 ? 'badge-success' : user.completionRate >= 50 ? 'badge-warning' : 'badge-info'}">
              ${user.completionRate}%
            </span>
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- TIMELINE INFO -->
  ${reportData.timeline && reportData.timeline.length > 0 ? `
  <div class="section">
    <h2 class="section-title">${translations.tasksTimeline || 'Evolução de Tarefas'}</h2>
    <div class="chart-placeholder">
      📊 ${translations.chartInfo || 'Gráfico de evolução ao longo do tempo'}
      <br/>
      <small>${translations.chartNote || 'Dados disponíveis na versão interativa'}</small>
    </div>
    <table>
      <thead>
        <tr>
          <th>${translations.date || 'Data'}</th>
          <th class="text-right">${translations.completed || 'Concluídas'}</th>
          <th class="text-right">${translations.inProgress || 'Em Progresso'}</th>
          <th class="text-right">${translations.pending || 'Pendentes'}</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.timeline.slice(0, 10).map(item => `
        <tr>
          <td>${new Date(item.date).toLocaleDateString('pt-PT')}</td>
          <td class="text-right"><span class="badge badge-success">${item.completed}</span></td>
          <td class="text-right"><span class="badge badge-warning">${item.inProgress}</span></td>
          <td class="text-right"><span class="badge badge-info">${item.pending}</span></td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- FOOTER -->
  <div class="footer">
    <p>${translations.confidential || 'Documento confidencial - Uso interno apenas'}</p>
    <p>${translations.generatedBy || 'Gerado por'} <span class="footer-brand">${companyName || 'OrganiZen'}</span></p>
    <p>© ${new Date().getFullYear()} ${translations.allRightsReserved || 'Todos os direitos reservados'}</p>
  </div>
</body>
</html>
  `;

  return html;
}
