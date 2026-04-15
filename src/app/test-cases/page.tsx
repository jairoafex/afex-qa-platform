'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useToast } from '@/lib/toast-context'
import { 
  Filter,
  RotateCcw,
  Search,
  Eye,
  Edit2,
  Paperclip,
  Copy,
} from 'lucide-react'
import { getStatusColor, translateStatus, translatePriority } from '@/lib/utils'
import Link from 'next/link'
import SearchableSelect from '@/components/SearchableSelect'

export default function TestCasesPage() {
  const { showToast } = useToast()
  const [testCases, setTestCases] = useState<any[]>([])
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [testPlans, setTestPlans] = useState<any[]>([])

  // Filtros
  const [filters, setFilters] = useState({
    testPlanId: '',
    status: '',
    priority: '',
    search: '',
  })

  // Input de búsqueda con debounce
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const clearFilters = () => {
    setSearchInput('')
    setFilters({ testPlanId: '', status: '', priority: '', search: '' })
  }

  const hasActiveFilters = !!filters.search || !!filters.testPlanId || !!filters.status || !!filters.priority

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchTestPlans()
  }, [])

  useEffect(() => {
    fetchTestCases()
  }, [filters, page])

  const fetchTestPlans = async () => {
    try {
      const res = await fetch('/api/casos')
      const data = await res.json()
      if (data.success) setTestPlans(data.data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchTestCases = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.testPlanId) params.append('testPlanId', filters.testPlanId)
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)
      params.append('page', page.toString())

      const res = await fetch(`/api/test-cases?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setTestCases(data.data.data)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (testCaseId: string) => {
    if (duplicating) return
    setDuplicating(testCaseId)
    try {
      const res = await fetch(`/api/test-cases/${testCaseId}/duplicate`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Escenario duplicado como ${data.data.caseId}`, 'success')
        fetchTestCases()
      } else {
        showToast(data.error || 'Error al duplicar', 'error')
      }
    } catch {
      showToast('Error al duplicar el escenario', 'error')
    } finally {
      setDuplicating(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Escenarios de Prueba</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona y ejecuta tus escenarios de prueba. Los casos se crean desde los casos de prueba.</p>
        </div>

        {/* Filtros */}
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

          {/* Fila 1: Búsqueda + Caso de Prueba JIRA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Buscar escenario</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por ID o nombre..."
                  className="input-field w-full text-sm"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Caso de Prueba (JIRA)</label>
              <SearchableSelect
                options={testPlans.map(plan => ({ value: plan.id, label: plan.jiraTask }))}
                value={filters.testPlanId}
                onChange={(value) => setFilters(f => ({ ...f, testPlanId: value }))}
                placeholder="Todos los casos"
              />
            </div>
          </div>

          {/* Fila 2: Estado + Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <SearchableSelect
                options={[
                  { value: 'PENDING',      label: 'Por hacer' },
                  { value: 'IN_PROGRESS',  label: 'En progreso' },
                  { value: 'FAILED',       label: 'Fallido' },
                  { value: 'BLOCKED',      label: 'Bloqueado' },
                  { value: 'OUT_OF_SCOPE', label: 'Fuera de alcance' },
                  { value: 'APPROVED',     label: 'Aprobado' },
                ]}
                value={filters.status}
                onChange={(value) => setFilters(f => ({ ...f, status: value }))}
                placeholder="Todos los estados"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prioridad</label>
              <SearchableSelect
                options={[
                  { value: 'CRITICAL', label: 'Crítica' },
                  { value: 'HIGH',     label: 'Alta' },
                  { value: 'MEDIUM',   label: 'Media' },
                  { value: 'LOW',      label: 'Baja' },
                ]}
                value={filters.priority}
                onChange={(value) => setFilters(f => ({ ...f, priority: value }))}
                placeholder="Todas las prioridades"
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
              {filters.testPlanId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                  📋 {testPlans.find(p => p.id === filters.testPlanId)?.jiraTask}
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                  {translateStatus(filters.status)}
                </span>
              )}
              {filters.priority && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                  {translatePriority(filters.priority)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Lista de casos */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afex-green"></div>
          </div>
        ) : testCases.length === 0 ? (
          <div className="card text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No hay escenarios de prueba
            </h3>
            <p className="text-gray-600 mb-4">
              Los escenarios de prueba se crean desde un Caso de Prueba (tarea JIRA).
              Crea un plan primero y luego añade casos dentro de él.
            </p>
            <Link href="/test-plans" className="btn-primary">
              Ir a Casos de Prueba
            </Link>
          </div>
        ) : (
          <>
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre del Caso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etiquetas</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Evidencia</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depende de</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testCases.map((testCase) => (
                    <tr key={testCase.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{testCase.caseId}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-md">
                          <div className="font-medium">{testCase.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Link 
                          href={`/test-plans/${testCase.testPlanId}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {testCase.testPlan?.jiraTask || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{testCase.testPlan?.qaEngineer?.name || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge text-xs ${getStatusColor(testCase.status)}`}>{translateStatus(testCase.status)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge text-xs ${
                          testCase.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          testCase.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          testCase.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                        }`}>{translatePriority(testCase.priority)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {(() => {
                            try {
                              const tagList: string[] = testCase.tags ? JSON.parse(testCase.tags) : []
                              if (!tagList.length) return <span className="text-gray-400 text-xs">—</span>
                              const TAG_COLORS = [
                                'bg-blue-100 text-blue-700',
                                'bg-purple-100 text-purple-700',
                                'bg-teal-100 text-teal-700',
                                'bg-pink-100 text-pink-700',
                                'bg-indigo-100 text-indigo-700',
                                'bg-green-100 text-green-700',
                              ]
                              return tagList.map((tag, i) => (
                                <span key={tag} className={`inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                                  {tag}
                                </span>
                              ))
                            } catch {
                              return <span className="text-gray-400 text-xs">—</span>
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {testCase._count?.attachments > 0 ? (
                          <span className="inline-flex items-center text-blue-600">
                            <Paperclip className="h-4 w-4 mr-1" />{testCase._count.attachments}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{testCase.dependsOnCase?.caseId || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/test-cases/${testCase.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link href={`/test-cases/${testCase.id}/edit`} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title=" Editar">
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(testCase.id)}
                            disabled={duplicating === testCase.id}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
                            title="Duplicar escenario"
                          >
                            {duplicating === testCase.id
                              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                              : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4">
                <div className="text-sm text-gray-600">{testCases.length} casos</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-50">
                    Anterior
                  </button>
                  <span className="text-gray-600">Página {page} de {totalPages}</span>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary disabled:opacity-50">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
