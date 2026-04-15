'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  ArrowLeft, 
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  FolderKanban,
  Calendar,
  User,
  GitBranch,
  MessageSquare,
  Paperclip,
  History
} from 'lucide-react'
import { formatDate, getStatusColor, translateStatus, translatePriority, getPriorityColor } from '@/lib/utils'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'

export default function TestCaseDetailPage() {
  const { showToast } = useToast()
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string

  const [testCase, setTestCase] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (caseId) {
      fetchTestCase()
    }
  }, [caseId])

  const fetchTestCase = async () => {
    try {
      const res = await fetch(`/api/test-cases/${caseId}`)
      const data = await res.json()

      if (data.success) {
        setTestCase(data.data)
      } else {
        showToast('Caso de prueba no encontrado', 'error')
        setTimeout(() => router.push('/test-cases'), 500)
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al cargar caso', 'error')
      setTimeout(() => router.push('/test-cases'), 500)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PASSED':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-6 w-6 text-red-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-6 w-6 text-blue-600" />
      case 'BLOCKED':
        return <AlertCircle className="h-6 w-6 text-orange-600" />
      default:
        return <FileText className="h-6 w-6 text-gray-600" />
    }
  }

  if (loading || !testCase) {
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/test-plans/${testCase.testPlanId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Escenarios de Prueba
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                {getStatusIcon(testCase.status)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{testCase.caseId}</h1>
                <h2 className="text-base text-gray-600 mt-0.5">{testCase.name}</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`badge ${getStatusColor(testCase.status)}`}>
                    {translateStatus(testCase.status)}
                  </span>
                  <span className={`badge ${getPriorityColor(testCase.priority)}`}>
                    {translatePriority(testCase.priority)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/test-cases/${caseId}/edit`}
              className="btn-primary"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </Link>
          </div>
        </div>

        {/* Información General */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Información General</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <FolderKanban className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Caso de Prueba</p>
                  <Link 
                    href={`/test-plans/${testCase.testPlanId}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {testCase.testPlan?.jiraTask}
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FolderKanban className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Épica</p>
                  <p className="font-medium text-gray-800">{testCase.testPlan?.epic || '—'}</p>
                </div>
              </div>

              {testCase.module && (
                <div className="flex items-start gap-3">
                  <GitBranch className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Módulo</p>
                    <p className="font-medium text-gray-800">{testCase.module.name}</p>
                  </div>
                </div>
              )}

              {testCase.component && (
                <div className="flex items-start gap-3">
                  <GitBranch className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Componente</p>
                    <p className="font-medium text-gray-800">{testCase.component.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Creado por</p>
                  <p className="font-medium text-gray-800">{testCase.user?.name}</p>
                </div>
              </div>

              {testCase.dependsOnCase && (
                <div className="flex items-start gap-3">
                  <GitBranch className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Depende de</p>
                    <p className="font-medium text-gray-800">{testCase.dependsOnCase.caseId} - {testCase.dependsOnCase.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Detalles de Ejecución</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Creado</p>
                  <p className="font-medium text-gray-800">{formatDate(testCase.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Última Actualización</p>
                  <p className="font-medium text-gray-800">{formatDate(testCase.updatedAt)}</p>
                </div>
              </div>

              {testCase.executedAt && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Ejecutado</p>
                    <p className="font-medium text-gray-800">{formatDate(testCase.executedAt)}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Descripción */}
        {testCase.description && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Descripción</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 max-h-64 overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {testCase.description}
              </p>
            </div>
          </div>
        )}

        {/* Pasos */}
        {testCase.steps && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Pasos a Ejecutar</h3>
            <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md font-mono text-sm">
              {testCase.steps}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {testCase.observations && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Observaciones</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 max-h-52 overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {testCase.observations}
              </p>
            </div>
          </div>
        )}

        {/* Resultado Final */}
        {testCase.finalResult && (
          <div className="card border-l-4 border-green-400">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Resultado Final</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 max-h-52 overflow-y-auto">
              <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
                {testCase.finalResult}
              </p>
            </div>
          </div>
        )}

        {/* Gherkin */}
        {testCase.gherkinScenario && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Escenario Gherkin</h3>
            <pre className="text-gray-700 bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
              {testCase.gherkinScenario}
            </pre>
          </div>
        )}

        {/* Historial de cambios */}
        {testCase.changeLogs && testCase.changeLogs.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-5 w-5 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-800">Historial de cambios</h3>
            </div>
            <div className="rounded-md border border-gray-200 overflow-hidden">
              <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="pl-3 pr-2 py-1.5 text-left text-gray-500 font-medium w-6">#</th>
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Cambio</th>
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">Usuario</th>
                      <th className="pl-2 pr-3 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {testCase.changeLogs.map((log: any, i: number) => (
                      <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="pl-3 pr-2 py-1.5 text-gray-400 font-mono select-none">{testCase.changeLogs.length - i}</td>
                        <td className="px-2 py-1.5 text-gray-700 max-w-0 w-full">
                          <span className="block truncate" title={log.message}>{log.message}</span>
                        </td>
                        <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{log.user?.name}</td>
                        <td className="pl-2 pr-3 py-1.5 text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Adjuntos y Comentarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testCase.attachments && testCase.attachments.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="h-5 w-5 text-gray-600" />
                <h3 className="text-base font-semibold text-gray-800">
                  Adjuntos ({testCase.attachments.length})
                </h3>
              </div>
              <div className="space-y-2">
                {testCase.attachments.map((attachment: any) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md text-sm text-blue-600"
                  >
                    <Paperclip className="h-4 w-4" />
                    {attachment.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}

          {testCase.comments && testCase.comments.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <h3 className="text-base font-semibold text-gray-800">
                  Comentarios ({testCase.comments.length})
                </h3>
              </div>
              <div className="space-y-3">
                {testCase.comments.map((comment: any) => (
                  <div key={comment.id} className="border-l-2 border-gray-200 pl-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-800">{comment.user?.name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
