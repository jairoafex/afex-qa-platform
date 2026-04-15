'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  ArrowLeft, 
  Plus, 
  FolderKanban, 
  Calendar,
  User,
  CheckCircle,
  TestTube,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Copy
} from 'lucide-react'
import { formatDate, getStatusColor, translateStatus, translatePriority, getPriorityColor } from '@/lib/utils'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'

export default function TestPlanDetailPage() {
  const { showToast } = useToast()
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string

  const [plan, setPlan] = useState<any>(null)
  const [testCases, setTestCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  useEffect(() => {
    if (planId) {
      fetchPlanDetail()
      fetchTestCases()
    }
  }, [planId])

  const fetchPlanDetail = async () => {
    try {
      const res = await fetch(`/api/casos/${planId}`)
      const data = await res.json()
      
      if (data.success) {
        setPlan(data.data)
      } else {
        showToast('No se pudo cargar el caso de prueba', 'error')
        setTimeout(() => router.push('/test-plans'), 500)
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al cargar el plan', 'error')
      setTimeout(() => router.push('/test-plans'), 500)
    } finally {
      setLoading(false)
    }
  }

  const fetchTestCases = async () => {
    try {
      const res = await fetch(`/api/test-cases?testPlanId=${planId}&pageSize=100`)
      const data = await res.json()
      
      if (data.success) {
        setTestCases(data.data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PASSED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'BLOCKED':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'bg-purple-100 text-purple-700'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700'
      case 'COMPLETED':
        return 'bg-green-100 text-green-700'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const translatePlanStatus = (status: string) => {
    const translations: Record<string, string> = {
      CREATED: 'Creado',
      IN_PROGRESS: 'En ejecución',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    }
    return translations[status] || status
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

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'xlsx',
          filters: { testPlanId: planId },
        }),
      })

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `casos-${plan?.jiraTask}-${Date.now()}.xlsx`
      a.click()
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al exportar', 'error')
    }
  }

  if (loading || !plan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afex-green"></div>
        </div>
      </DashboardLayout>
    )
  }

  const passedCases = testCases.filter(c => c.status === 'APPROVED' || c.status === 'PASSED').length
  const failedCases = testCases.filter(c => c.status === 'FAILED').length
  const pendingCases = testCases.filter(c => c.status === 'PENDING').length
  const progress = testCases.length > 0 ? (passedCases / testCases.length) * 100 : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link 
            href="/test-plans" 
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Casos de Prueba
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{plan.jiraTask}</h1>
                <span className={`badge mt-1 ${getStatusBadgeColor(plan.status)}`}>
                  {translatePlanStatus(plan.status)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="btn-secondary"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <Link
                href={`/test-plans/${planId}/edit`}
                className="btn-secondary"
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </Link>
              <Link
                href={`/test-plans/${planId}/new-case`}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Nuevo Escenario de Prueba
              </Link>
            </div>
          </div>

          {/* Descripción y metadata — ancho completo */}
          {plan.description && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 max-h-52 overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {plan.description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4" />
              <span>{plan.epic || 'Sin épica'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{plan.user?.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Creado: {formatDate(plan.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Estadísticas del Plan */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Casos</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{testCases.length}</p>
              </div>
              <TestTube className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Aprobados</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{passedCases}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Fallidos</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{failedCases}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{pendingCases}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Progreso de Ejecución</h3>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{passedCases} aprobados</span>
            <span>{testCases.length} total</span>
          </div>
        </div>

        {/* Lista de Escenarios de Prueba */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">
              Escenarios de Prueba ({testCases.length})
            </h3>
          </div>

          {testCases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                No hay escenarios de prueba
              </h4>
              <p className="text-gray-600 mb-4">
                Comienza agregando el primer escenario de prueba a este plan
              </p>
              <Link
                href={`/test-plans/${planId}/new-case`}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Crear Primer Caso
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {testCases.map((testCase) => (
                <div 
                  key={testCase.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(testCase.status)}
                        <h4 className="text-sm font-semibold text-gray-800">
                          {testCase.caseId} - {testCase.name}
                        </h4>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">{testCase.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <span className={`badge text-xs ${getStatusColor(testCase.status)}`}>
                          {translateStatus(testCase.status)}
                        </span>
                        <span className={`badge text-xs ${getPriorityColor(testCase.priority)}`}>
                          {translatePriority(testCase.priority)}
                        </span>
                        {testCase.module && (
                          <span className="badge text-xs bg-gray-100 text-gray-600">
                            {testCase.module.name}
                          </span>
                        )}
                      </div>

                      {testCase.executedAt && (
                        <div className="mt-2 text-xs text-gray-500">
                          Ejecutado: {formatDate(testCase.executedAt)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 ml-4">
                      <Link
                        href={`/test-cases/${testCase.id}`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/test-cases/${testCase.id}/edit`}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(testCase.id)}
                        disabled={duplicating === testCase.id}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50"
                        title="Duplicar escenario"
                      >
                        {duplicating === testCase.id
                          ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                          : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
