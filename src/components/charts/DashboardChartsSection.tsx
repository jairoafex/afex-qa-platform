'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { AlertTriangle, FileText, Paperclip, Zap, Users } from 'lucide-react'

const PRIORITY_FILL: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#22c55e',
}

const STATUS_COLORS: Record<string, string> = {
  approvedCases:   '#22c55e',
  failedCases:     '#ef4444',
  inProgressCases: '#3b82f6',
  pendingCases:    '#94a3b8',
  blockedCases:    '#f97316',
  outOfScopeCases: '#6b7280',
  skippedCases:    '#a855f7',
}

function passRateTextColor(rate: number) {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function passRateFillColor(rate: number) {
  if (rate >= 80) return 'bg-green-500'
  if (rate >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function formatActivityDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })
}

export default function DashboardChartsSection({ stats }: { stats: any }) {
  const statusPieData = [
    { name: 'Aprobados',        value: stats.approvedCases,   color: STATUS_COLORS.approvedCases },
    { name: 'Fallidos',         value: stats.failedCases,     color: STATUS_COLORS.failedCases },
    { name: 'En progreso',      value: stats.inProgressCases, color: STATUS_COLORS.inProgressCases },
    { name: 'Pendientes',       value: stats.pendingCases,    color: STATUS_COLORS.pendingCases },
    { name: 'Bloqueados',       value: stats.blockedCases,    color: STATUS_COLORS.blockedCases },
    { name: 'Fuera de alcance', value: stats.outOfScopeCases, color: STATUS_COLORS.outOfScopeCases },
    { name: 'Omitidos',         value: stats.skippedCases,    color: STATUS_COLORS.skippedCases },
  ].filter(d => d.value > 0)

  const activityData = (stats.recentActivity || []).map((d: any) => ({
    ...d,
    fecha: formatActivityDate(d.date),
  }))

  return (
    <>
      {/* ── Fila 3: Gráficos de distribución ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie: distribución por estado */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Distribución por Estado</h3>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%" cy="50%"
                  outerRadius={95}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) =>
                    percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                >
                  {statusPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Casos']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          )}
        </div>

        {/* Bar: por prioridad */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Casos por Prioridad</h3>
          {stats.byPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byPriority} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="priority" width={72} tick={{ fontSize: 13 }} />
                <Tooltip formatter={(v: any) => [v, 'Casos']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.byPriority.map((entry: any) => (
                    <Cell key={entry.value} fill={PRIORITY_FILL[entry.value] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* ── Fila 4: Indicadores de riesgo y calidad documental ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Indicadores de Riesgo y Calidad Documental
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RiskCard
            title="Alta Prio. sin Ejecutar"
            value={stats.highPriorityPending}
            description="Críticos + Altos en estado pendiente o en progreso"
            icon={AlertTriangle}
            alert={stats.highPriorityPending > 0}
          />
          <RiskCard
            title="Sin Pasos Definidos"
            value={stats.casesWithoutSteps}
            description="Escenarios sin documentación de pasos"
            icon={FileText}
            alert={stats.casesWithoutSteps > 0}
          />
          <RiskCard
            title="Sin Evidencia"
            value={stats.casesWithoutEvidence}
            description={`${stats.casesWithEvidence} escenarios tienen evidencia adjunta`}
            icon={Paperclip}
            alert={false}
          />
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-indigo-500" />
              <p className="text-sm font-medium text-gray-600">Velocidad Promedio</p>
            </div>
            <div className="flex items-end gap-1 mt-1">
              <p className="text-4xl font-bold text-indigo-600">{stats.avgExecutionDays}</p>
              <p className="text-base text-gray-500 mb-1">días</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">desde creación hasta ejecución</p>
          </div>
        </div>
      </div>

      {/* ── Fila 5: Tendencia de ejecución (30 días) ── */}
      {activityData.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Tendencia de Ejecución — Últimos 30 días
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="executed" stroke="#3b82f6" name="Ejecutados" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="approved" stroke="#22c55e" name="Aprobados"  strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="failed"   stroke="#ef4444" name="Fallidos"   strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Fila 6: Pass rate por sistema ── */}
      {stats.bySystem.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-5">Pass Rate por Sistema</h3>
          <div className="space-y-5">
            {stats.bySystem.map((sys: any) => (
              <div key={sys.systemId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{sys.systemName}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">✓ {sys.approved}</span>
                    <span className="text-red-600">✗ {sys.failed}</span>
                    {sys.blocked > 0 && <span className="text-orange-500">⊘ {sys.blocked}</span>}
                    <span className="text-gray-400">{sys.count} total</span>
                    <span className={`font-bold w-10 text-right ${passRateTextColor(sys.passRate)}`}>
                      {sys.passRate}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${passRateFillColor(sys.passRate)}`}
                    style={{ width: `${Math.min(sys.passRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fila 7: Tipo de prueba + Célula ── */}
      <div className={`grid grid-cols-1 ${stats.byCelula.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>

        {/* Tipo de prueba */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Casos por Tipo de Prueba</h3>
          {stats.byTestType.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.byTestType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: any) => [v, 'Casos']} />
                <Bar dataKey="count" fill="#5cb85c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          )}
        </div>

        {/* Pass rate por célula */}
        {stats.byCelula.length > 0 && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              Pass Rate por Célula
            </h3>
            <div className="space-y-4">
              {stats.byCelula.map((celula: any) => (
                <div key={celula.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{celula.name}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-600">✓ {celula.approved}</span>
                      <span className="text-red-600">✗ {celula.failed}</span>
                      <span className="text-gray-400">{celula.total} total</span>
                      <span className={`font-bold w-10 text-right ${passRateTextColor(celula.passRate)}`}>
                        {celula.passRate}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${passRateFillColor(celula.passRate)}`}
                      style={{ width: `${Math.min(celula.passRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function RiskCard({
  title, value, description, icon: Icon, alert,
}: {
  title: string
  value: number
  description: string
  icon: any
  alert: boolean
}) {
  const isAlert = alert && value > 0
  return (
    <div className={`card ${isAlert ? 'border border-orange-200 bg-orange-50' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-5 w-5 ${isAlert ? 'text-orange-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-600">{title}</p>
      </div>
      <p className={`text-3xl font-bold ${isAlert ? 'text-orange-600' : 'text-gray-800'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  )
}
