'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter
} from 'lucide-react'

const MetricsChartsSection = dynamic(
  () => import('@/components/charts/MetricsChartsSection'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afex-green" />
      </div>
    ),
  }
)

// Mapeo de período (selector UI) → parámetro de API
const PERIOD_MAP: Record<string, string> = {
  week: 'week',
  month: 'month',
  quarter: 'quarter',
  all: 'all',
}

export default function MetricsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    fetchStats()
  }, [period])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period: PERIOD_MAP[period] ?? 'all' })
      const res = await fetch(`/api/dashboard/stats?${params}`)
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (error) {
      console.error('Error cargando métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899']

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afex-green"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Métricas y Reportes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Análisis detallado de tus pruebas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Período</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'week',    label: 'Última semana' },
              { value: 'month',   label: 'Último mes' },
              { value: 'quarter', label: 'Último trimestre' },
              { value: 'all',     label: 'Todo' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  period === opt.value
                    ? 'bg-afex-green text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Casos</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {stats.totalTestCases}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tasa de Éxito</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.passRate}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Sobre {stats.executedCases} ejecutados
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Casos Fallidos</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {stats.failedCases}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.defectRate}% tasa de defectos
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {stats.pendingCases}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">En cola de ejecución</div>
          </div>
        </div>

        {/* Gráficos */}
        <MetricsChartsSection stats={stats} />

        {/* Tabla de detalle por tipo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Casos por Tipo de Prueba
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% del total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.byTestType.map((item: any) => (
                  <tr key={item.type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-afex-green h-2 rounded-full"
                            style={{ width: `${stats.totalTestCases > 0 ? (item.count / stats.totalTestCases) * 100 : 0}%` }}
                          />
                        </div>
                        <span>{stats.totalTestCases > 0 ? Math.round((item.count / stats.totalTestCases) * 100) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla por prioridad */}
        {stats.byPriority.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Casos por Prioridad
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% del total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.byPriority.map((item: any) => (
                    <tr key={item.value}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.priority}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-afex-green h-2 rounded-full"
                              style={{ width: `${stats.totalTestCases > 0 ? (item.count / stats.totalTestCases) * 100 : 0}%` }}
                            />
                          </div>
                          <span>{stats.totalTestCases > 0 ? Math.round((item.count / stats.totalTestCases) * 100) : 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
