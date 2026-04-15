'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Save, Trash2, History, Tag } from 'lucide-react'
import { X } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'

export default function EditTestCasePage() {
  const { showToast, showConfirm } = useToast()
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string

  const [testCase, setTestCase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [testCases, setTestCases] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    preconditions: '',
    steps: '',
    observations: '',
    finalResult: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    dependsOnCaseId: '',
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

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
        const tc = data.data
        setTestCase(tc)
        setFormData({
          name: tc.name,
          description: tc.description || '',
          preconditions: tc.preconditions || '',
          steps: tc.steps || '',
          observations: tc.observations || '',
          finalResult: tc.finalResult || '',
          priority: tc.priority,
          status: tc.status,
          dependsOnCaseId: tc.dependsOnCaseId || '',
        })
        // Parsear tags guardados
        try {
          const parsed = tc.tags ? JSON.parse(tc.tags) : []
          setTags(Array.isArray(parsed) ? parsed : [])
        } catch {
          setTags([])
        }
        // Cargar casos del mismo plan para el selector de dependencia
        if (tc.testPlanId) {
          const casesRes = await fetch(`/api/test-cases?testPlanId=${tc.testPlanId}&pageSize=100`)
          const casesData = await casesRes.json()
          if (casesData.success) {
            setTestCases(casesData.data.data.filter((c: any) => c.id !== caseId))
          }
        }
      } else {
        showToast('Caso de prueba no encontrado', 'error')
        router.push('/test-cases')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al cargar caso', 'error')
      router.push('/test-cases')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      showToast('El nombre del escenario es obligatorio', 'warning')
      return
    }

    const isFinalStatus = ['APPROVED', 'PASSED'].includes(formData.status)
    if (isFinalStatus && !formData.finalResult.trim()) {
      showToast('El resultado final es obligatorio para estados Aprobado / Exitoso', 'warning')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/test-cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          preconditions: formData.preconditions || null,
          tags,
          dependsOnCaseId: formData.dependsOnCaseId || undefined,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        showToast(data.error || 'Error al actualizar escenario de prueba', 'error')
        setSubmitting(false)
        return
      }

      showToast('Escenario de prueba actualizado exitosamente', 'success')
      setTimeout(() => router.push(`/test-plans/${testCase.testPlanId}`), 500)
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al actualizar escenario de prueba', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    showConfirm(
      '¿Estás seguro de eliminar este escenario de prueba?',
      async () => {
        try {
          const res = await fetch(`/api/test-cases/${caseId}`, {
            method: 'DELETE',
          })

          const data = await res.json()

          if (data.success) {
            showToast('Escenario de prueba eliminado', 'success')
            setTimeout(() => router.push(`/test-plans/${testCase.testPlanId}`), 500)
          } else {
            showToast(data.error || 'Error al eliminar', 'error')
          }
        } catch (error) {
          console.error('Error:', error)
          showToast('Error al eliminar caso', 'error')
        }
      }
    )
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/test-plans/${testCase.testPlanId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Caso
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Editar Escenario de Prueba</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {testCase.caseId} — Plan: {testCase.testPlan?.jiraTask}
              </p>
            </div>

            <button
              onClick={handleDelete}
              className="btn-danger"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Escenario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
            />
          </div>

          {/* Precondiciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precondiciones <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </label>
            <textarea
              value={formData.preconditions}
              onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Define aquí las precondiciones para ejecutar este escenario de prueba. Ej: El usuario debe estar autenticado, el sistema debe tener datos de prueba cargados..."
            />
          </div>

          {/* Estado y Prioridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="PENDING">Por hacer</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="FAILED">Fallido</option>
                <option value="BLOCKED">Bloqueado</option>
                <option value="OUT_OF_SCOPE">Fuera de alcance</option>
                <option value="SKIPPED">Omitido</option>
                <option value="APPROVED">Aprobado</option>
                <option value="PASSED">Exitoso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
          </div>

          {/* Dependencias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependencia <span className="text-gray-400 text-xs font-normal">(otro escenario de este caso)</span>
            </label>
            <select
              value={formData.dependsOnCaseId}
              onChange={(e) => setFormData({ ...formData, dependsOnCaseId: e.target.value })}
              className="input-field"
            >
              <option value="">Sin dependencias</option>
              {testCases.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.caseId} - {tc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pasos a ejecutar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pasos a ejecutar <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </label>
            <textarea
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              className="input-field"
              rows={6}
              placeholder={`Describe cada paso de forma numerada. Ej:\n1. Acceder a la URL de la aplicación\n2. Ingresar usuario y contraseña válidos\n3. Hacer clic en "Iniciar Sesión"\n4. Verificar que se redirige al dashboard`}
            />
          </div>

          {/* Etiquetas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-gray-400" />
              Etiquetas <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </label>
            <div className={`input-field min-h-[42px] flex flex-wrap gap-1.5 items-center ${tags.length > 0 ? 'py-1.5' : ''}`}>
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    e.preventDefault()
                    const newTag = tagInput.trim().toLowerCase().replace(/,/g, '')
                    if (newTag && !tags.includes(newTag) && tags.length < 8) {
                      setTags([...tags, newTag])
                    }
                    setTagInput('')
                  } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                    setTags(tags.slice(0, -1))
                  }
                }}
                onBlur={() => {
                  const newTag = tagInput.trim().toLowerCase()
                  if (newTag && !tags.includes(newTag) && tags.length < 8) {
                    setTags([...tags, newTag])
                    setTagInput('')
                  }
                }}
                placeholder={tags.length === 0 ? 'Enter para agregar (ej: regresión, smoke, login)' : ''}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-xs placeholder:text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Presiona Enter o coma para agregar. Máx. 8 etiquetas.</p>
          </div>

          {/* Resultado Final */}
          <div className="border-t pt-6">
            <label className={`block text-sm font-medium mb-1 ${['APPROVED','PASSED'].includes(formData.status) ? 'text-gray-700' : 'text-gray-400'}`}>
              Resultado Final
              {['APPROVED','PASSED'].includes(formData.status)
                ? <span className="text-red-500"> *</span>
                : <span className="text-gray-400 text-xs font-normal"> (disponible al aprobar/exitoso)</span>
              }
            </label>
            {['APPROVED','PASSED'].includes(formData.status) ? (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  Describe el resultado obtenido al ejecutar este escenario de prueba.
                </p>
                <textarea
                  value={formData.finalResult}
                  onChange={(e) => setFormData({ ...formData, finalResult: e.target.value })}
                  className="input-field"
                  rows={4}
                  placeholder="Ej: El sistema respondió correctamente. Se validó que..."
                  required
                />
              </>
            ) : (
              <div className="input-field bg-gray-50 text-gray-400 text-sm cursor-not-allowed select-none" style={{ minHeight: '80px' }}>
                Cambia el estado a <strong>Aprobado</strong> o <strong>Exitoso</strong> para registrar el resultado final.
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Notas, observaciones o comentarios adicionales"
            />
          </div>

          {/* Historial de cambios */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Historial de cambios</h3>
            </div>
            <div className="rounded-md border border-gray-200 overflow-hidden">
              {testCase.changeLogs && testCase.changeLogs.length > 0 ? (
                <div className="overflow-y-auto" style={{ maxHeight: '140px' }}>
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
              ) : (
                <div className="flex items-center justify-center bg-gray-50 " style={{ height: '90px' }}>
                  <p className="text-xs text-gray-400">Sin registros de cambios aún.</p>
                </div>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <Link href={`/test-cases/${caseId}`} className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
