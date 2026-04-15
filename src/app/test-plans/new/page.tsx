'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SearchableSelect from '@/components/SearchableSelect'
import { ArrowLeft, Save, FolderKanban, X, Loader2 } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'

export default function NewTestPlanPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [jiraLoading, setJiraLoading] = useState(false)
  const [jiraFound, setJiraFound] = useState(false)
  const [celulas, setCelulas] = useState<any[]>([])
  const [allDevelopers, setAllDevelopers] = useState<any[]>([])
  const [developers, setDevelopers] = useState<any[]>([])
  const [qas, setQAs] = useState<any[]>([])
  const [epicKey, setEpicKey] = useState<string | null>(null)
  const [jiraRaw, setJiraRaw] = useState<{ assignee: string | null; priority: string | null; epicName: string | null; summary: string | null; projectName: string | null }>({
    assignee: null, priority: null, epicName: null, summary: null, projectName: null,
  })
  const skipCelulaEffect = useRef(false)

  const [formData, setFormData] = useState({
    jiraTask: '',
    description: '',
    epic: '',
    celulaId: '',
    developerId: '',
    qaId: '',
    priority: 'MEDIUM',
    relatedJiraTasks: [] as string[],
    newJiraTask: '',
  })

  useEffect(() => {
    fetchCelulas()
    fetchAllDevelopers()
  }, [])

  useEffect(() => {
    if (skipCelulaEffect.current) {
      skipCelulaEffect.current = false
      return
    }
    if (formData.celulaId) {
      fetchDevelopers(formData.celulaId)
      fetchQAs(formData.celulaId)
      setFormData((prev) => ({ ...prev, developerId: '', qaId: '' }))
    } else {
      setDevelopers([])
      setQAs([])
      setFormData((prev) => ({ ...prev, developerId: '', qaId: '' }))
    }
  }, [formData.celulaId])

  const fetchCelulas = async () => {
    try {
      const res = await fetch('/api/celulas')
      const data = await res.json()
      if (data.success) setCelulas(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchAllDevelopers = async () => {
    try {
      const res = await fetch('/api/developers')
      const data = await res.json()
      if (data.success) setAllDevelopers(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  /** Encuentra el id del item cuyo nombre tiene mayor coincidencia con query */
  const findBestMatch = (list: { id: string; name: string }[], query: string): string => {
    if (!query || !list.length) return ''
    const q = query.toLowerCase()
    const exact = list.find((item) => item.name.toLowerCase() === q)
    if (exact) return exact.id
    const contains = list.find(
      (item) => q.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(q)
    )
    if (contains) return contains.id
    const qWords = new Set(q.split(/\s+/).filter((w) => w.length > 2))
    let best = { id: '', score: 0 }
    for (const item of list) {
      const iWords = item.name.toLowerCase().split(/\s+/)
      const score = iWords.filter((w) => qWords.has(w)).length
      if (score > best.score) best = { id: item.id, score }
    }
    return best.score > 0 ? best.id : ''
  }

  const fetchDevelopers = async (celulaId: string): Promise<any[]> => {
    try {
      const res = await fetch(`/api/developers?celulaId=${celulaId}`)
      const data = await res.json()
      if (data.success) {
        setDevelopers(data.data)
        return data.data
      }
      return []
    } catch (error) {
      console.error('Error:', error)
      return []
    }
  }

  const PRIORITY_MAP: Record<string, string> = {
    Highest: 'CRITICAL',
    High: 'HIGH',
    Medium: 'MEDIUM',
    Low: 'LOW',
    Lowest: 'LOW',
  }

  const fetchJiraIssue = async (issueKey: string) => {
    if (!issueKey || !/^[A-Z]+-\d+$/.test(issueKey)) return
    setJiraLoading(true)
    setJiraFound(false)
    try {
      const res = await fetch(`/api/jira/${issueKey}`)
      const data = await res.json()
      if (data.success) {
        const issue = data.data
        const mappedPriority = issue.priority ? (PRIORITY_MAP[issue.priority] ?? 'MEDIUM') : 'MEDIUM'

        // Auto-match célula por nombre de proyecto Jira
        const matchedCelulaId = findBestMatch(celulas, issue.projectName)

        // Cargar developers del celula matched ANTES de setFormData
        // para que SearchableSelect tenga las opciones al renderizar
        let filteredDevs: any[] = []
        if (matchedCelulaId) {
          skipCelulaEffect.current = true
          filteredDevs = await fetchDevelopers(matchedCelulaId)
          fetchQAs(matchedCelulaId)
        }

        // Buscar developer en la lista filtrada (o en todos si no hay celula)
        const matchedDevId = findBestMatch(
          filteredDevs.length ? filteredDevs : allDevelopers,
          issue.assignee ?? ''
        )

        // Epic: guardar nombre (más legible), clave solo como referencia visual
        setEpicKey(issue.epic ?? null)
        setJiraRaw({
          assignee: issue.assignee ?? null,
          priority: issue.priority ?? null,
          epicName: issue.epicName ?? null,
          summary: issue.summary ?? null,
          projectName: issue.projectName ?? null,
        })
        setFormData((prev) => ({
          ...prev,
          description: issue.description || issue.summary,
          epic: issue.epicName || issue.epic || '',
          priority: mappedPriority,
          celulaId: matchedCelulaId || prev.celulaId,
          developerId: matchedDevId || prev.developerId,
        }))
        setJiraFound(true)
      } else {
        showToast(data.error || 'Issue no encontrado en Jira', 'warning')
      }
    } catch {
      showToast('No se pudo conectar con Jira', 'error')
    } finally {
      setJiraLoading(false)
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
      showToast('Por favor completa todos los campos', 'warning')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/casos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraTask: formData.jiraTask,
          title: jiraRaw.summary || undefined,
          description: formData.description,
          epic: formData.epic || undefined,
          celulaId: formData.celulaId || undefined,
          developerId: formData.developerId || undefined,
          qaId: formData.qaId || undefined,
          priority: formData.priority,
          jiraAssignee: jiraRaw.assignee || undefined,
          jiraCelula: jiraRaw.projectName || undefined,
          relatedJiraTasks: formData.relatedJiraTasks.length > 0 ? formData.relatedJiraTasks : undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        showToast('Caso de prueba creado exitosamente', 'success')
        setTimeout(() => router.push(`/test-plans/${data.data.id}`), 500)
      } else {
        showToast(data.error || 'Error al crear caso de prueba', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al crear caso de prueba', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/test-plans"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Casos de Prueba
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Nuevo Caso de Prueba</h1>
              <p className="text-sm text-gray-500 mt-0.5">Asociado a una tarea JIRA</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="form-label form-label-required">Código JIRA</label>
            {jiraFound && jiraRaw.summary ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-xs font-bold text-green-700 bg-green-100 border border-green-300 rounded px-2 py-0.5 font-mono">{formData.jiraTask}</span>
                  <span className="text-sm text-gray-800 truncate">{jiraRaw.summary}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setJiraFound(false)
                    setJiraRaw({ assignee: null, priority: null, epicName: null, summary: null, projectName: null })
                    setEpicKey(null)
                    setFormData((prev) => ({ ...prev, jiraTask: '', description: '', epic: '', priority: 'MEDIUM', celulaId: '', developerId: '', qaId: '' }))
                  }}
                  className="shrink-0 text-xs text-gray-400 hover:text-red-500"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={formData.jiraTask}
                  onChange={(e) => { setFormData({ ...formData, jiraTask: e.target.value.toUpperCase() }); setJiraFound(false) }}
                  onBlur={(e) => fetchJiraIssue(e.target.value)}
                  className="input-field"
                  placeholder="Ej: AGR-1234"
                  required
                />
                <p className="text-xs mt-1 flex items-center gap-1.5">
                  {jiraLoading
                    ? <><Loader2 className="h-3 w-3 animate-spin text-blue-500" /><span className="text-blue-600">Consultando Jira...</span></>
                    : <span className="text-gray-400">Ingresa el código y sal del campo para cargar los datos</span>
                  }
                </p>
              </>
            )}
          </div>

          <div>
            <label className="form-label">Épica (opcional)</label>
            {jiraFound && jiraRaw.epicName ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                {epicKey && <span className="shrink-0 text-xs text-gray-400 font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5">{epicKey}</span>}
                <span className="text-sm text-gray-800 truncate">{jiraRaw.epicName}</span>
              </div>
            ) : (
              <input
                type="text"
                value={formData.epic}
                onChange={(e) => { setFormData({ ...formData, epic: e.target.value }); setEpicKey(null) }}
                className="input-field"
                placeholder="Nombre o clave de la épica"
              />
            )}
            <p className="text-xs text-gray-400 mt-1">{jiraFound && jiraRaw.epicName ? '⚡ Cargada desde Jira' : 'Épica JIRA asociada (opcional)'}</p>
          </div>

          <div>
            <label className="form-label form-label-required">Prioridad</label>
            {jiraFound && jiraRaw.priority ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                {formData.priority === 'CRITICAL' && <span>🔴</span>}
                {formData.priority === 'HIGH' && <span>🟠</span>}
                {formData.priority === 'MEDIUM' && <span>🟡</span>}
                {formData.priority === 'LOW' && <span>🟢</span>}
                <span className="text-sm text-gray-800">{jiraRaw.priority}</span>
              </div>
            ) : (
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="input-field" required>
                <option value="CRITICAL">🔴 Crítica</option>
                <option value="HIGH">🟠 Alta</option>
                <option value="MEDIUM">🟡 Media</option>
                <option value="LOW">🟢 Baja</option>
              </select>
            )}
            <p className="text-xs text-gray-400 mt-1">{jiraFound && jiraRaw.priority ? '⚡ Cargada desde Jira' : 'Nivel de prioridad del plan de prueba'}</p>
          </div>

          {/* Sección Célula / Desarrollador / QA */}
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Equipo asignado (opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Célula</label>
                {jiraFound && jiraRaw.projectName ? (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                    <span className="text-sm text-gray-800 truncate">{jiraRaw.projectName}</span>
                  </div>
                ) : (
                  <SearchableSelect options={celulas.map((c) => ({ value: c.id, label: c.name }))} value={formData.celulaId} onChange={(value) => setFormData({ ...formData, celulaId: value })} placeholder="Sin célula" />
                )}
                <p className="text-xs text-gray-400 mt-1">{jiraFound && jiraRaw.projectName ? '⚡ Cargada desde Jira' : ''}</p>
              </div>

              <div>
                <label className="form-label">Desarrollador</label>
                {jiraFound && jiraRaw.assignee ? (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                    <span className="text-sm text-gray-800 truncate">{jiraRaw.assignee}</span>
                  </div>
                ) : (
                  <SearchableSelect options={developers.map((d) => ({ value: d.id, label: d.name }))} value={formData.developerId} onChange={(value) => setFormData({ ...formData, developerId: value })} placeholder="Sin desarrollador" disabled={!formData.celulaId} />
                )}
                <p className="text-xs text-gray-400 mt-1">{jiraFound && jiraRaw.assignee ? '⚡ Cargado desde Jira' : !formData.celulaId ? 'Selecciona una célula primero' : ''}</p>
              </div>

              <div>
                <label className="form-label">QA</label>
                <SearchableSelect
                  options={qas.map((q) => ({
                    value: q.id,
                    label: q.name
                  }))}
                  value={formData.qaId}
                  onChange={(value) => setFormData({ ...formData, qaId: value })}
                  placeholder="Sin QA"
                  disabled={!formData.celulaId}
                />
                {!formData.celulaId && (
                  <p className="text-xs text-gray-400 mt-1">Selecciona una célula primero</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">
              Tareas JIRA Relacionadas (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.newJiraTask}
                onChange={(e) => setFormData({ ...formData, newJiraTask: e.target.value.toUpperCase() })}
                className="input-field flex-1"
                placeholder="Ingrese la tarea JIRA (Ej: AFEX-5678)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (formData.newJiraTask && !formData.relatedJiraTasks.includes(formData.newJiraTask)) {
                      setFormData({
                        ...formData,
                        relatedJiraTasks: [...formData.relatedJiraTasks, formData.newJiraTask],
                        newJiraTask: ''
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
                      newJiraTask: ''
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
                          relatedJiraTasks: formData.relatedJiraTasks.filter((t) => t !== task)
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
            <p className="text-xs text-gray-500 mt-1">
              Otras tareas JIRA relacionadas (presiona Enter o haz clic en Agregar)
            </p>
          </div>

          <div>
            <label className="form-label form-label-required">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={5}
              placeholder="Describe el objetivo y alcance de este caso de prueba..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Proporciona una descripción detallada del caso de prueba
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-semibold text-green-900 mb-2">💡 ¿Qué es un Caso de Prueba?</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Un caso de prueba agrupa escenarios de prueba relacionados a una tarea JIRA</li>
              <li>• Permite organizar y ejecutar pruebas de manera estructurada</li>
              <li>• Una vez creado, podrás agregar escenarios de prueba individuales</li>
              <li>• Puedes usar IA para generar casos automáticamente desde historias de usuario</li>
            </ul>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-5 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Creando...' : 'Crear Caso de Prueba'}
            </button>
            <Link href="/test-plans" className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
