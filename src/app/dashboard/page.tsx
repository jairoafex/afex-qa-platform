'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SearchableSelect from '@/components/SearchableSelect'
import {
  CheckCircle2,
  XCircle,
  Clock,
  TestTube,
  FolderKanban,
  AlertCircle,
  TrendingUp,
  Shield,
  Filter,
  RotateCcw,
  Search,
} from 'lucide-react'

const DashboardChartsSection = dynamic(
  () => import('@/components/charts/DashboardChartsSection'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afex-green" />
      </div>
    ),
  }
)

// ── Helpers de color para pass rate ──
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

const PERIOD_OPTIONS = [
  { value: 'all',     label: 'Todo el tiempo' },
  { value: 'week',    label: 'Esta semana' },
  { value: 'month',   label: 'Este mes' },
  { value: 'quarter', label: 'Últimos 3 meses' },
]

const DEFAULT_FILTERS = { period: 'all', dateFrom: '', dateTo: '', testPlanId: '', celulaId: '', qaId: '' }

// ── Componente principal ──
export default function DashboardPage() {
  const [stats, setStats]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testPlans, setTestPlans] = useState<any[]>([])
  const [testPlanSearch, setTestPlanSearch] = useState('')
  const [celulas, setCelulas] = useState<any[]>([])
  const [qas, setQas]         = useState<any[]>([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  // Carga de selects — en paralelo
  useEffect(() => {
    Promise.all([
      fetch('/api/casos?pageSize=500').then(r => r.json()),
      fetch('/api/celulas').then(r => r.json()),
    ]).then(([plans, cel]) => {
      if (plans.success) setTestPlans(plans.data.data)
      if (cel.success)   setCelulas(cel.data)
    }).catch(console.error)
  }, [])

  // QAs — se recargan cuando cambia la célula (cascada)
  useEffect(() => {
    const url = filters.celulaId
      ? `/api/qas?celulaId=${filters.celulaId}`
      : '/api/qas'
    fetch(url).then(r => r.json()).then(data => {
      if (data.success) setQas(data.data)
    }).catch(console.error)
  }, [filters.celulaId])

  // Cuando cambia la célula, limpiar el QA si ya no pertenece a ella
  const handleCelulaChange = (celulaId: string) => {
    setFilters(f => ({ ...f, celulaId, qaId: '' }))
  }

  useEffect(() => { fetchStats() }, [filters])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.period && filters.period !== 'all') params.set('period', filters.period)
      if (filters.period === 'custom') {
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
        if (filters.dateTo)   params.set('dateTo',   filters.dateTo)
      }
      if (filters.testPlanId) params.set('testPlanId', filters.testPlanId)
      if (filters.celulaId)   params.set('celulaId',   filters.celulaId)
      if (filters.qaId)       params.set('qaId',        filters.qaId)
      const res  = await fetch(`/api/dashboard/stats?${params}`)
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setTestPlanSearch('')
  }

  const hasActiveFilters = filters.period !== 'all' || !!filters.testPlanId || !!filters.celulaId || !!filters.qaId

  const activePeriodLabel = filters.period === 'custom'
    ? `${filters.dateFrom || '?'} → ${filters.dateTo || '?'}`
    : (PERIOD_OPTIONS.find(p => p.value === filters.period)?.label || 'Todo el tiempo')

  // Test plans filtrados por búsqueda
  const filteredTestPlans = testPlanSearch.trim()
    ? testPlans.filter(p =>
        p.jiraTask.toLowerCase().includes(testPlanSearch.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(testPlanSearch.toLowerCase())
      )
    : testPlans

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afex-green" />
        </div>
      </DashboardLayout>
    )
  }

  const totalPct = (n: number) =>
    stats.totalTestCases > 0 ? Math.round((n / stats.totalTestCases) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard QA</h1>
          <p className="text-sm text-gray-500 mt-0.5">Indicadores de calidad y cobertura de pruebas</p>
        </div>

        {/* ── Barra de filtros ── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter className="h-4 w-4" />
              Filtros
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Fila 1: Período — segmented control + fechas inline */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Período</label>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Segmented control */}
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
                {[...PERIOD_OPTIONS, { value: 'custom', label: 'Personalizado' }].map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setFilters(f => ({
                      ...f,
                      period: o.value,
                      ...(o.value !== 'custom' ? { dateFrom: '', dateTo: '' } : {}),
                    }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      filters.period === o.value
                        ? 'bg-white text-afex-green shadow-sm border border-gray-200 font-semibold'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {/* Fechas inline — solo cuando period=custom */}
              {filters.period === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    max={filters.dateTo || undefined}
                    onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    className="input-field text-sm py-1.5 w-36"
                    placeholder="Desde"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <input
                    type="date"
                    value={filters.dateTo}
                    min={filters.dateFrom || undefined}
                    onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    className="input-field text-sm py-1.5 w-36"
                    placeholder="Hasta"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Fila 2: Caso de Prueba, Célula, QA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* Caso de Prueba (Tarea JIRA) con búsqueda */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Caso de Prueba (JIRA)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por tarea o descripción..."
                  value={testPlanSearch}
                  onChange={(e) => {
                    setTestPlanSearch(e.target.value)
                    if (!e.target.value) setFilters(f => ({ ...f, testPlanId: '' }))
                  }}
                  className="input-field w-full text-sm"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
              {testPlanSearch && filteredTestPlans.length > 0 && !filters.testPlanId && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
                  <div className="max-h-48 overflow-y-auto p-1.5">
                    {filteredTestPlans.slice(0, 10).map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setFilters(f => ({ ...f, testPlanId: p.id }))
                          setTestPlanSearch(p.jiraTask)
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-100"
                      >
                        <span className="font-medium text-gray-900">{p.jiraTask}</span>
                        {p.description && (
                          <span className="text-gray-400 text-xs ml-2 truncate">{p.description.slice(0, 45)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {filteredTestPlans.length > 10 && (
                    <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/60">
                      <p className="text-[11px] text-gray-400">{filteredTestPlans.length} resultados · mostrando 10</p>
                    </div>
                  )}
                </div>
              )}
              {filters.testPlanId && (
                <button
                  onClick={() => { setFilters(f => ({ ...f, testPlanId: '' })); setTestPlanSearch('') }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 mt-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Quitar selección
                </button>
              )}
            </div>

            {/* Célula */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Célula</label>
              <SearchableSelect
                options={celulas.map(c => ({ value: c.id, label: c.name }))}
                value={filters.celulaId}
                onChange={handleCelulaChange}
                placeholder="Todas las células"
              />
            </div>

            {/* QA Asignado — cascada según célula */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                QA Asignado
                {filters.celulaId && <span className="text-blue-500 ml-1 font-normal">(filtrado)</span>}
              </label>
              <SearchableSelect
                options={qas.map(q => ({ value: q.id, label: q.name }))}
                value={filters.qaId}
                onChange={(value) => setFilters(f => ({ ...f, qaId: value }))}
                placeholder="Todos los QAs"
                disabled={qas.length === 0}
              />
            </div>
          </div>

          {/* Chips de filtros activos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {filters.period !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                  📅 {activePeriodLabel}
                </span>
              )}
              {filters.testPlanId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                  📋 {testPlans.find(p => p.id === filters.testPlanId)?.jiraTask}
                </span>
              )}
              {filters.celulaId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                  👥 {celulas.find(c => c.id === filters.celulaId)?.name}
                </span>
              )}
              {filters.qaId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                  👤 {qas.find(q => q.id === filters.qaId)?.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Fila 1: Métricas primarias ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Escenarios"
            value={stats.totalTestCases}
            icon={TestTube}
            iconBg="bg-blue-500"
            subtitle={`${stats.totalPlans} planes de prueba`}
          />
          <StatCard
            title="Aprobados"
            value={stats.approvedCases}
            icon={CheckCircle2}
            iconBg="bg-green-500"
            subtitle={`${totalPct(stats.approvedCases)}% del total`}
          />
          <StatCard
            title="Fallidos"
            value={stats.failedCases}
            icon={XCircle}
            iconBg="bg-red-500"
            subtitle={`${stats.defectRate}% tasa de defectos`}
          />
          <StatCard
            title="En Progreso"
            value={stats.inProgressCases}
            icon={Clock}
            iconBg="bg-blue-400"
            subtitle={`${stats.pendingCases} pendientes`}
          />
        </div>

        {/* ── Fila 2: KPIs de calidad ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Pass Rate — tarjeta destacada */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pass Rate</p>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className={`text-4xl font-bold ${passRateTextColor(stats.passRate)}`}>
              {stats.passRate}%
            </p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${passRateFillColor(stats.passRate)}`}
                style={{ width: `${Math.min(stats.passRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.approvedCases} aprobados de {stats.executedCases} ejecutados
            </p>
          </div>

          {/* Planes de prueba */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-600">Planes Activos</p>
              <FolderKanban className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.activePlans}</p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-purple-600">{stats.pendingPlans} sin iniciar</span>
              <span className="text-green-600">{stats.completedPlans} completados</span>
            </div>
          </div>

          {/* Bloqueados */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-600">Bloqueados</p>
              <Shield className="h-5 w-5 text-orange-500" />
            </div>
            <p className={`text-3xl font-bold ${stats.blockedCases > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
              {stats.blockedCases}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.outOfScopeCases} fuera de alcance · {stats.skippedCases} omitidos
            </p>
          </div>

          {/* Críticos Fallidos — alerta visual */}
          <div className={`card ${stats.criticalFailedCases > 0 ? 'border border-red-200 bg-red-50' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-600">Críticos Fallidos</p>
              <AlertCircle className={`h-5 w-5 ${stats.criticalFailedCases > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <p className={`text-3xl font-bold ${stats.criticalFailedCases > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {stats.criticalFailedCases}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.criticalFailedCases > 0 ? '⚠ Requieren atención inmediata' : 'Sin fallos críticos'}
            </p>
          </div>
        </div>

        <DashboardChartsSection stats={stats} />

      </div>
    </DashboardLayout>
  )
}

// ── Sub-componentes ──

function StatCard({
  title, value, icon: Icon, iconBg, subtitle,
}: {
  title: string
  value: number
  icon: any
  iconBg: string
  subtitle?: string
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </div>
  )
}
