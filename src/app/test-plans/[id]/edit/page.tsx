'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SearchableSelect from '@/components/SearchableSelect'
import { ArrowLeft, Save, X } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'

export default function EditTestPlanPage() {
  const { showToast } = useToast()
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string

  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [celulas, setCelulas] = useState<any[]>([])
  const [developers, setDevelopers] = useState<any[]>([])
  const [qas, setQAs] = useState<any[]>([])

  const [formData, setFormData] = useState({
    jiraTask: '',
    description: '',
    epic: '',
    celulaId: '',
    developerId: '',
    qaId: '',
    status: '',
    relatedJiraTasks: [] as string[],
    newJiraTask: '',
  })

  useEffect(() => {
    if (planId) {
      fetchPlan()
      fetchCelulas()
    }
  }, [planId])

  useEffect(() => {
    if (formData.celulaId) {
      fetchDevelopers(formData.celulaId)
      fetchQAs(formData.celulaId)
    } else {
      setDevelopers([])
      setQAs([])
    }
  }, [formData.celulaId])

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/casos/${planId}`)
      const data = await res.json()
      if (data.success) {
        const p = data.data
        setPlan(p)
        setFormData({
          jiraTask: p.jiraTask || '',
          description: p.description || '',
          epic: p.epic || '',
          celulaId: p.celulaId || '',
          developerId: p.developerId || '',
          qaId: p.qaId || '',
          status: p.status || '',
          relatedJiraTasks: p.relatedJiraTasks ? JSON.parse(p.relatedJiraTasks) : [],
          newJiraTask: '',
        })
        if (p.celulaId) {
          fetchDevelopers(p.celulaId)
          fetchQAs(p.celulaId)
        }
      } else {
        showToast('Caso de prueba no encontrado', 'error')
        router.push('/test-plans')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al cargar caso de prueba', 'error')
      router.push('/test-plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchCelulas = async () => {
    try {
      const res = await fetch('/api/celulas')
      const data = await res.json()
      if (data.success) setCelulas(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchDevelopers = async (celulaId: string) => {
    try {
      const res = await fetch(`/api/developers?celulaId=${celulaId}`)
      const data = await res.json()
      if (data.success) setDevelopers(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchQAs = async (celulaId: string) => {
    try {
      const res = await fetch(`/api/qas?celulaId=${celulaId}`)
      const data = await res.json()
      if (data.success) setQAs(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.jiraTask || !formData.description) {
      showToast('Por favor completa los campos obligatorios', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/casos/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraTask: formData.jiraTask,
          description: formData.description,
          epic: formData.epic || null,
          celulaId: formData.celulaId || null,
          developerId: formData.developerId || null,
          qaId: formData.qaId || null,
          status: formData.status || undefined,
          relatedJiraTasks: formData.relatedJiraTasks.length > 0 ? formData.relatedJiraTasks : null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        showToast('Caso de prueba actualizado exitosamente', 'success')
        setTimeout(() => router.push(`/test-plans/${planId}`), 500)
      } else {
        showToast(data.error || 'Error al actualizar', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al actualizar caso de prueba', 'error')
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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/test-plans/${planId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Caso de Prueba
          </Link>

          <h1 className="text-xl font-semibold text-gray-900">Editar Caso de Prueba</h1>
          <p className="text-sm text-gray-500 mt-0.5">{plan.jiraTask}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Código JIRA */}
          <div>
            <label className="form-label form-label-required">Código JIRA</label>
            <input
              type="text"
              value={formData.jiraTask}
              onChange={(e) => setFormData({ ...formData, jiraTask: e.target.value.toUpperCase() })}
              className="input-field"
              placeholder="Ej: AFEX-1234"
              required
            />
          </div>

          {/* Épica */}
          <div>
            <label className="form-label">Épica (opcional)</label>
            <input
              type="text"
              value={formData.epic}
              onChange={(e) => setFormData({ ...formData, epic: e.target.value.toUpperCase() })}
              className="input-field"
              placeholder="Ej: AFEX-EPIC-001"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="form-label">Estado</label>
            <SearchableSelect
              options={[
                { value: 'CREATED', label: 'Creado' },
                { value: 'IN_PROGRESS', label: 'En ejecución' },
                { value: 'COMPLETED', label: 'Completado' },
                { value: 'CANCELLED', label: 'Cancelado' },
              ]}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              placeholder="Seleccione estado"
            />
          </div>

          {/* Célula / Desarrollador / QA */}
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Equipo asignado (opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Célula</label>
                <SearchableSelect
                  options={celulas.map((c) => ({ value: c.id, label: c.name }))}
                  value={formData.celulaId}
                  onChange={(value) => setFormData({ ...formData, celulaId: value, developerId: '', qaId: '' })}
                  placeholder="Sin célula"
                />
              </div>
              <div>
                <label className="form-label">Desarrollador</label>
                <SearchableSelect
                  options={developers.map((d) => ({ value: d.id, label: d.name }))}
                  value={formData.developerId}
                  onChange={(value) => setFormData({ ...formData, developerId: value })}
                  placeholder="Sin desarrollador"
                  disabled={!formData.celulaId}
                />
                {!formData.celulaId && <p className="text-xs text-gray-400 mt-1">Selecciona una célula primero</p>}
              </div>
              <div>
                <label className="form-label">QA</label>
                <SearchableSelect
                  options={qas.map((q) => ({ value: q.id, label: q.name }))}
                  value={formData.qaId}
                  onChange={(value) => setFormData({ ...formData, qaId: value })}
                  placeholder="Sin QA"
                  disabled={!formData.celulaId}
                />
                {!formData.celulaId && <p className="text-xs text-gray-400 mt-1">Selecciona una célula primero</p>}
              </div>
            </div>
          </div>

          {/* Tareas JIRA relacionadas */}
          <div>
            <label className="form-label">Tareas JIRA Relacionadas (opcional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.newJiraTask}
                onChange={(e) => setFormData({ ...formData, newJiraTask: e.target.value.toUpperCase() })}
                className="input-field flex-1"
                placeholder="Ej: AFEX-5678"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (formData.newJiraTask && !formData.relatedJiraTasks.includes(formData.newJiraTask)) {
                      setFormData({
                        ...formData,
                        relatedJiraTasks: [...formData.relatedJiraTasks, formData.newJiraTask],
                        newJiraTask: '',
                      })
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.newJiraTask && !formData.relatedJiraTasks.includes(formData.newJiraTask)) {
                    setFormData({
                      ...formData,
                      relatedJiraTasks: [...formData.relatedJiraTasks, formData.newJiraTask],
                      newJiraTask: '',
                    })
                  }
                }}
                className="btn-secondary"
              >
                Agregar
              </button>
            </div>
            {formData.relatedJiraTasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.relatedJiraTasks.map((task) => (
                  <span
                    key={task}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {task}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          relatedJiraTasks: formData.relatedJiraTasks.filter((t) => t !== task),
                        })
                      }
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="form-label form-label-required">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={5}
              placeholder="Describe el objetivo y alcance de este caso de prueba..."
              required
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
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
