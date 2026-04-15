'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Plus, FolderKanban, Edit2, Search, RotateCcw, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import SearchableSelect from '@/components/SearchableSelect'

const DEFAULT_FILTERS = { search: '', status: '', celulaId: '', qaId: '', dateFrom: '', dateTo: '' }

export default function TestPlansPage() {
  const [testPlans, setTestPlans]   = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [celulas, setCelulas]       = useState<any[]>([])
  const [qas, setQas]               = useState<any[]>([])
  const [filters, setFilters]       = useState(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carga inicial de selects
  useEffect(() => {
    Promise.all([
      fetch('/api/celulas').then(r => r.json()),
      fetch('/api/qas').then(r => r.json()),
    ]).then(([cel, q]) => {
      if (cel.success) setCelulas(cel.data)
      if (q.success)   setQas(q.data)
    }).catch(console.error)
  }, [])

  // Cuando cambia la célula, recargar QAs en cascada
  useEffect(() => {
    const url = filters.celulaId ? `/api/qas?celulaId=${filters.celulaId}` : '/api/qas'
    fetch(url).then(r => r.json()).then(data => {
      if (data.success) setQas(data.data)
    }).catch(console.error)
  }, [filters.celulaId])

  // Debounce del campo de búsqueda JIRA
  const handleSearchInput = (value: string) => {
    setSearchInput(value)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: value }))
    }, 350)
  }

  useEffect(() => { fetchTestPlans() }, [filters])

  const fetchTestPlans = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search)   params.set('search',   filters.search)
      if (filters.status)   params.set('status',   filters.status)
      if (filters.celulaId) params.set('celulaId', filters.celulaId)
      if (filters.qaId)     params.set('qaId',     filters.qaId)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo)   params.set('dateTo',   filters.dateTo)
      params.set('pageSize', '100')

      const res  = await fetch(`/api/casos?${params}`)
      const data = await res.json()
      if (data.success) setTestPlans(data.data.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchInput('')
  }

  const hasActiveFilters =
    !!filters.search || !!filters.status || !!filters.celulaId ||
    !!filters.qaId   || !!filters.dateFrom || !!filters.dateTo

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED':     return 'bg-purple-100 text-purple-700'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700'
      case 'COMPLETED':   return 'bg-green-100 text-green-700'
      case 'CANCELLED':   return 'bg-red-100 text-red-700'
      default:            return 'bg-gray-100 text-gray-700'
    }
  }

  const translateStatus = (status: string) => {
    const t: Record<string, string> = {
      CREATED: 'Creado', IN_PROGRESS: 'En ejecución',
      COMPLETED: 'Completado', CANCELLED: 'Cancelado',
    }
    return t[status] || status
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Casos de Prueba</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestiona tus casos de prueba asociados a tareas JIRA</p>
          </div>
          <Link href="/test-plans/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo Caso de Prueba
          </Link>
        </div>

        {/* ── Filtros ── */}
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

          {/* Fila 1: Búsqueda JIRA + Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Código JIRA */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Código JIRA</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Ej: AGR-10232, AFEX-1234..."
                  className="input-field w-full text-sm"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <SearchableSelect
                options={[
                  { value: 'CREATED',     label: 'Creado' },
                  { value: 'IN_PROGRESS', label: 'En ejecución' },
                  { value: 'COMPLETED',   label: 'Completado' },
                  { value: 'CANCELLED',   label: 'Cancelado' },
                ]}
                value={filters.status}
                onChange={(value) => setFilters(f => ({ ...f, status: value }))}
                placeholder="Todos los estados"
              />
            </div>
          </div>

          {/* Fila 2: Célula, QA, Fecha desde, Fecha hasta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Célula */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Célula</label>
              <SearchableSelect
                options={celulas.map(c => ({ value: c.id, label: c.name }))}
                value={filters.celulaId}
                onChange={(value) => setFilters(f => ({ ...f, celulaId: value, qaId: '' }))}
                placeholder="Todas las células"
              />
            </div>

            {/* QA */}
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

            {/* Fecha desde */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="input-field w-full text-sm"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="input-field w-full text-sm"
              />
            </div>
          </div>

          {/* Chips de filtros activos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                  🔍 {filters.search}
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                  {translateStatus(filters.status)}
                </span>
              )}
              {filters.celulaId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">
                  👥 {celulas.find(c => c.id === filters.celulaId)?.name}
                </span>
              )}
              {filters.qaId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                  👤 {qas.find(q => q.id === filters.qaId)?.name}
                </span>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                  📅 {filters.dateFrom || '…'} → {filters.dateTo || '…'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Lista de planes */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afex-green"></div>
          </div>
        ) : testPlans.length === 0 ? (
          <div className="card text-center py-12">
            <FolderKanban className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {hasActiveFilters ? 'Sin resultados' : 'No hay casos de prueba'}
            </h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters
                ? 'Ningún caso coincide con los filtros aplicados.'
                : 'Comienza creando tu primer caso de prueba'}
            </p>
            {!hasActiveFilters && (
              <Link href="/test-plans/new" className="btn-primary">
                <Plus className="h-5 w-5" />
                Crear Caso de Prueba
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código JIRA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarea</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Célula</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desarrollador</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testPlans.map((plan) => {
                  const progress = plan.totalCases > 0
                    ? Math.round((plan.completedCases / plan.totalCases) * 100)
                    : 0
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-gray-800">{plan.jiraTask}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-gray-700 truncate" title={plan.title || plan.description}>
                          {plan.title || plan.description || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge text-xs ${getStatusColor(plan.status)}`}>
                          {translateStatus(plan.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {plan.celula?.name || plan.jiraCelula || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {plan.developer?.name || plan.jiraAssignee || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {plan.qaEngineer?.name || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-9 text-right">{progress}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{plan.completedCases}/{plan.totalCases} casos</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(plan.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/test-plans/${plan.id}`}
                            className="text-blue-600 hover:underline text-sm font-medium"
                          >
                            Ver caso
                          </Link>
                          <Link
                            href={`/test-plans/${plan.id}/edit`}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
