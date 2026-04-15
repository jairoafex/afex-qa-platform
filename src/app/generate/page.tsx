'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

export default function GeneratePage() {
  const { showToast } = useToast()
  const [userStory, setUserStory] = useState('')
  const [systems, setSystems] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [selectedSystem, setSelectedSystem] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [testTypes, setTestTypes] = useState<string[]>(['FUNCTIONAL'])
  const [includeBoundary, setIncludeBoundary] = useState(true)
  const [includeNegative, setIncludeNegative] = useState(true)
  const [includeIntegration, setIncludeIntegration] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatedCases, setGeneratedCases] = useState<any[]>([])
  const [testPlanId, setTestPlanId] = useState('')
  const [testPlans, setTestPlans] = useState<any[]>([])

  useEffect(() => {
    fetchSystems()
    fetchTestPlans()
  }, [])

  useEffect(() => {
    if (selectedSystem) {
      const system = systems.find((s) => s.id === selectedSystem)
      setModules(system?.modules || [])
    }
  }, [selectedSystem, systems])

  const fetchSystems = async () => {
    try {
      const res = await fetch('/api/systems')
      const data = await res.json()
      if (data.success) setSystems(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchTestPlans = async () => {
    try {
      const res = await fetch('/api/casos')
      const data = await res.json()
      if (data.success) setTestPlans(data.data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleGenerate = async () => {
    if (!userStory || !selectedSystem || !selectedModule) {
      showToast('Por favor completa todos los campos obligatorios', 'warning')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userStory,
          testTypes,
          includeBoundary,
          includeNegative,
          includeIntegration,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setGeneratedCases(data.data)
      } else {
        showToast(data.error || 'Error al generar casos', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al generar escenarios de prueba', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCases = async () => {
    if (!testPlanId) {
      showToast('Por favor selecciona un caso de prueba', 'warning')
      return
    }

    setLoading(true)
    try {
      for (const testCase of generatedCases) {
        await fetch('/api/test-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...testCase,
            testPlanId,
            systemId: selectedSystem,
            moduleId: selectedModule,
          }),
        })
      }
      showToast('Casos guardados exitosamente', 'success')
      setGeneratedCases([])
      setUserStory('')
    } catch (error) {
      console.error('Error:', error)
      showToast('Error al guardar casos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const testTypeOptions = [
    { value: 'FUNCTIONAL', label: 'Funcional' },
    { value: 'INTEGRATION', label: 'Integración' },
    { value: 'REGRESSION', label: 'Regresión' },
    { value: 'SMOKE', label: 'Smoke' },
    { value: 'E2E', label: 'E2E' },
    { value: 'API', label: 'API' },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Generar Escenarios de Prueba con IA
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Describe tu historia de usuario y genera casos automáticamente
            </p>
          </div>
        </div>

        {generatedCases.length === 0 ? (
          <div className="card space-y-6">
            {/* Historia de usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Historia de Usuario *
              </label>
              <textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                rows={8}
                className="input-field font-mono text-sm"
                placeholder="Como [rol], quiero [funcionalidad], para [beneficio]...

Ejemplo:
Como usuario del sistema Afex+, quiero poder crear giros internacionales seleccionando el país de destino, ingresando el monto en USD, y validando que el destinatario exista en la base de datos, para poder enviar dinero de forma segura."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sistema */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sistema *
                </label>
                <select
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecciona un sistema</option>
                  {systems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Módulo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Módulo *
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="input-field"
                  disabled={!selectedSystem}
                >
                  <option value="">Selecciona un módulo</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipos de prueba */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipos de Prueba
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {testTypeOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testTypes.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTestTypes([...testTypes, option.value])
                        } else {
                          setTestTypes(testTypes.filter((t) => t !== option.value))
                        }
                      }}
                      className="rounded border-gray-300 text-afex-green focus:ring-afex-green"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Opciones adicionales */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBoundary}
                  onChange={(e) => setIncludeBoundary(e.target.checked)}
                  className="rounded border-gray-300 text-afex-green focus:ring-afex-green"
                />
                <span className="text-sm text-gray-700">Incluir casos borde</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNegative}
                  onChange={(e) => setIncludeNegative(e.target.checked)}
                  className="rounded border-gray-300 text-afex-green focus:ring-afex-green"
                />
                <span className="text-sm text-gray-700">Incluir casos negativos</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeIntegration}
                  onChange={(e) => setIncludeIntegration(e.target.checked)}
                  className="rounded border-gray-300 text-afex-green focus:ring-afex-green"
                />
                <span className="text-sm text-gray-700">Incluir pruebas de integración</span>
              </label>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando casos...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Escenarios de Prueba
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header con acciones */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Casos Generados ({generatedCases.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Revisa y edita los casos antes de guardarlos
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGeneratedCases([])}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caso de Prueba *
                </label>
                <select
                  value={testPlanId}
                  onChange={(e) => setTestPlanId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecciona un caso de prueba</option>
                  {testPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.jiraTask} - {plan.description}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveCases}
                disabled={loading || !testPlanId}
                className="btn-primary disabled:opacity-50 mt-4"
              >
                {loading ? 'Guardando...' : 'Guardar Todos los Casos'}
              </button>
            </div>

            {/* Lista de casos generados */}
            <div className="space-y-4">
              {generatedCases.map((testCase, index) => (
                <div key={index} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {testCase.name}
                    </h3>
                    <div className="flex gap-2">
                      <span className={`badge ${
                        testCase.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        testCase.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        testCase.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {testCase.priority}
                      </span>
                      <span className="badge bg-blue-100 text-blue-700">
                        {testCase.testType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Descripción:</p>
                      <p className="text-gray-600 mt-1">{testCase.description}</p>
                    </div>

                    {testCase.preconditions && (
                      <div>
                        <p className="font-medium text-gray-700">Precondiciones:</p>
                        <p className="text-gray-600 mt-1">{testCase.preconditions}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-gray-700">Pasos:</p>
                      <ol className="list-decimal list-inside text-gray-600 mt-1 space-y-1">
                        {testCase.steps?.map((step: any, i: number) => (
                          <li key={i}>{step.action}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700">Resultado Esperado:</p>
                      <p className="text-gray-600 mt-1">{testCase.expectedResult}</p>
                    </div>

                    {testCase.gherkinScenario && (
                      <div>
                        <p className="font-medium text-gray-700">Escenario Gherkin:</p>
                        <pre className="bg-gray-50 p-3 rounded-md mt-1 text-xs overflow-x-auto">
                          {testCase.gherkinScenario}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
