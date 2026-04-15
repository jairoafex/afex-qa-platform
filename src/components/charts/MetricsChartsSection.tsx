'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899']

const STATUS_NAMES: Record<string, string> = {
  approvedCases:   'Aprobados',
  failedCases:     'Fallidos',
  inProgressCases: 'En progreso',
  pendingCases:    'Pendientes',
  blockedCases:    'Bloqueados',
  skippedCases:    'Skipped',
}

export default function MetricsChartsSection({ stats }: { stats: any }) {
  const statusPieData = [
    { name: STATUS_NAMES.approvedCases,   value: stats.approvedCases },
    { name: STATUS_NAMES.failedCases,     value: stats.failedCases },
    { name: STATUS_NAMES.inProgressCases, value: stats.inProgressCases },
    { name: STATUS_NAMES.pendingCases,    value: stats.pendingCases },
    { name: STATUS_NAMES.blockedCases,    value: stats.blockedCases },
    { name: STATUS_NAMES.skippedCases,    value: stats.skippedCases },
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Distribución por Estado */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Distribución por Estado
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusPieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              dataKey="value"
            >
              {statusPieData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Casos por Sistema */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Casos por Sistema
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.bySystem}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="systemName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="approved" fill="#10B981" name="Aprobados"  stackId="a" />
            <Bar dataKey="failed"   fill="#EF4444" name="Fallidos"   stackId="a" />
            <Bar dataKey="blocked"  fill="#F59E0B" name="Bloqueados" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tendencia de ejecución (últimos 30 días) */}
      <div className="card lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Tendencia de Ejecución (últimos 30 días)
        </h3>
        {stats.recentActivity.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-16">Sin actividad registrada en este período</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.recentActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="approved"  stroke="#10B981" name="Aprobados"  strokeWidth={2} />
              <Line type="monotone" dataKey="failed"    stroke="#EF4444" name="Fallidos"   strokeWidth={2} />
              <Line type="monotone" dataKey="executed"  stroke="#3B82F6" name="Ejecutados" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
