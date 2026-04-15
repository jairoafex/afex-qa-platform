'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Save, Upload, X, History, Tag } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'

export default function NewTestCasePage() {
  const { showToast } = useToast()
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string

  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [testCases, setTestCases] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    preconditions: '',
    steps: '',
    observations: '',
    priority: 'MEDIUM',
    dependsOnCaseId: '',
    attachments: [] as File[],
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (planId) {
      fetchPlan()
      fetchTestCases()
    }
  }, [planId])

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/casos/${planId}`)
      const data = await res.json()

      if (data.success) {
        setPlan(data.data)
      } else {
        showToast('Caso de prueba no encontrado', 'error')
        setTimeout(() => router.push('/test-plans'), 500)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTestCases = async () => {
    try {
      const res = await fetch(`/api/test-cases?testPlanId=${planId}&limit=100`)
      const data = await res.json()
      if (data.success) setTestCases(data.data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      showToast('El nombre del escenario es obligatorio', 'warning')
      return
    }

    setSubmitting(true)

    try {
      // Crear el escenario de prueba
      const res = await fetch('/api/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || '',
          preconditions: formData.preconditions || '',
          steps: formData.steps || '',
          observations: formData.observations || '',
          priority: formData.priority,
          tags,
          dependsOnCaseId: formData.dependsOnCaseId || undefined,
          testPlanId: planId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        const testCaseId = data.data.id

        // Subir archivos si existen
        if (formData.attachments.length > 0) {
          for (const file of formData.attachments) {
            const formDataFile = new FormData()
            formDataFile.append('file', file)
            formDataFile.append('testCaseId', testCaseId)

            await fetch('/api/upload', {
              method: 'POST',
              body: formDataFile,
            })
          }
        }

        showToast('Caso de prueba creado exitosamente', 'success')
        setTimeout(() => router.push(`/test-plans/${planId}`), 500)
      } else {
        showToast(data.error || 'Error al crear escenario de prueba', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al crear escenario de prueba', 'error')
    } finally {
      setSubmitting(false)
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/test-plans/${planId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Plan
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Nuevo Escenario de Prueba</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Plan: <span className="font-medium">{plan.jiraTask}</span>{plan.epic ? ` — ${plan.epic}` : ''}
              </p>
            </div>


          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Nombre del Escenario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Ej: Validar inicio de sesión exitoso"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Descripción <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Describe brevemente el objetivo de este escenario de prueba"
            />
          </div>

          {/* Precondiciones */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
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

          {/* Estado (fijo) y Prioridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Estado</label>
              <div className="input-field bg-gray-50 text-gray-500 flex items-center gap-2 cursor-not-allowed select-none">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                Por hacer (estado inicial)
              </div>
              <p className="text-xs text-gray-400 mt-1">Los escenarios siempre inician en "Por hacer"</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Prioridad</label>
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
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
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
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
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
            <label className="block text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
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

          {/* Evidencias */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Evidencias <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setFormData({ ...formData, attachments: [...formData.attachments, ...Array.from(e.target.files)] })
                    e.target.value = ''
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="btn-secondary cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Seleccionar archivos
              </label>
              {formData.attachments.length > 0 && (
                <span className="text-sm text-gray-500">{formData.attachments.length} archivo(s) seleccionado(s)</span>
              )}
            </div>
            {formData.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-sm text-gray-700 truncate">{file.name} <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span></span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, attachments: formData.attachments.filter((_, i) => i !== index) })}
                      className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
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
            <div className="bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center" style={{ height: '140px' }}>
              <p className="text-xs text-gray-400">El historial aparecerá aquí una vez creado el escenario.</p>
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
              {submitting ? 'Creando...' : 'Crear Escenario de Prueba'}
            </button>
            <Link href={`/test-plans/${planId}`} className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
