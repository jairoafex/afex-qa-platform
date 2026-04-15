'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Settings as SettingsIcon, Plus, Trash2, Users, Building2, TestTube2 } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Celula = { id: string; name: string }
type Developer = { id: string; name: string; email?: string; celulaId?: string; celula?: Celula }
type QA = { id: string; name: string; email?: string; celulaId?: string; celula?: Celula }

// ─────────────────────────────────────────────
// Modal reutilizable
// ─────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { showToast, showConfirm } = useToast()

  // ── Sistemas ──────────────────────────────
  const [systems, setSystems] = useState<any[]>([])
  const [loadingSys, setLoadingSys] = useState(false)
  const [showSystemForm, setShowSystemForm] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [systemForm, setSystemForm] = useState({ name: '', description: '', color: '#5cb85c', icon: '' })
  const [moduleForm, setModuleForm] = useState({ name: '', description: '', systemId: '' })

  // ── Células ───────────────────────────────
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [loadingCel, setLoadingCel] = useState(false)
  const [showCelulaForm, setShowCelulaForm] = useState(false)
  const [celulaForm, setCelulaForm] = useState({ name: '' })

  // ── Desarrolladores ───────────────────────
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loadingDev, setLoadingDev] = useState(false)
  const [showDevForm, setShowDevForm] = useState(false)
  const [devForm, setDevForm] = useState({ name: '', email: '', celulaId: '' })

  // ── QAs ───────────────────────────────────
  const [qas, setQAs] = useState<QA[]>([])
  const [loadingQA, setLoadingQA] = useState(false)
  const [showQAForm, setShowQAForm] = useState(false)
  const [qaForm, setQAForm] = useState({ name: '', email: '', celulaId: '' })

  useEffect(() => {
    fetchSystems()
    fetchCelulas()
    fetchDevelopers()
    fetchQAs()
  }, [])

  // ── Fetch ─────────────────────────────────
  const fetchSystems = async () => {
    try {
      const res = await fetch('/api/systems')
      const data = await res.json()
      if (data.success) setSystems(data.data)
    } catch (error) { console.error('Error cargando sistemas:', error) }
  }
  const fetchCelulas = async () => {
    try {
      const res = await fetch('/api/celulas')
      const data = await res.json()
      if (data.success) setCelulas(data.data)
    } catch (error) { console.error('Error cargando células:', error) }
  }
  const fetchDevelopers = async () => {
    try {
      const res = await fetch('/api/developers?isActive=true')
      const data = await res.json()
      if (data.success) setDevelopers(data.data)
    } catch (error) { console.error('Error cargando desarrolladores:', error) }
  }
  const fetchQAs = async () => {
    try {
      const res = await fetch('/api/qas')
      const data = await res.json()
      if (data.success) setQAs(data.data)
    } catch (error) { console.error('Error cargando QAs:', error) }
  }

  // ── Sistemas ──────────────────────────────
  const handleCreateSystem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSys(true)
    try {
      const res = await fetch('/api/systems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(systemForm) })
      const data = await res.json()
      if (data.success) {
        showToast('Sistema creado exitosamente', 'success')
        setShowSystemForm(false)
        setSystemForm({ name: '', description: '', color: '#5cb85c', icon: '' })
        fetchSystems()
      } else showToast(data.error, 'error')
    } catch { showToast('Error al crear sistema', 'error') }
    finally { setLoadingSys(false) }
  }
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSys(true)
    try {
      const res = await fetch('/api/modules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(moduleForm) })
      const data = await res.json()
      if (data.success) {
        showToast('Módulo creado exitosamente', 'success')
        setShowModuleForm(false)
        setModuleForm({ name: '', description: '', systemId: '' })
        fetchSystems()
      } else showToast(data.error, 'error')
    } catch { showToast('Error al crear módulo', 'error') }
    finally { setLoadingSys(false) }
  }

  // ── Células ───────────────────────────────
  const handleCreateCelula = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingCel(true)
    try {
      const res = await fetch('/api/celulas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(celulaForm) })
      const data = await res.json()
      if (data.success) {
        showToast('Célula creada exitosamente', 'success')
        setShowCelulaForm(false)
        setCelulaForm({ name: '' })
        fetchCelulas()
      } else showToast(data.error, 'error')
    } catch { showToast('Error al crear célula', 'error') }
    finally { setLoadingCel(false) }
  }
  const handleDeleteCelula = (id: string, name: string) => {
    showConfirm(`¿Eliminar la célula "${name}"?`, async () => {
      try {
        await fetch(`/api/celulas/${id}`, { method: 'DELETE' })
        showToast('Célula eliminada', 'success')
        fetchCelulas()
        fetchDevelopers()
        fetchQAs()
      } catch { showToast('Error al eliminar célula', 'error') }
    })
  }

  // ── Desarrolladores ───────────────────────
  const handleCreateDev = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingDev(true)
    try {
      const res = await fetch('/api/developers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(devForm) })
      const data = await res.json()
      if (data.success) {
        showToast('Desarrollador creado exitosamente', 'success')
        setShowDevForm(false)
        setDevForm({ name: '', email: '', celulaId: '' })
        fetchDevelopers()
      } else showToast(data.error, 'error')
    } catch { showToast('Error al crear desarrollador', 'error') }
    finally { setLoadingDev(false) }
  }
  const handleDeleteDev = (id: string, name: string) => {
    showConfirm(`¿Eliminar al desarrollador "${name}"?`, async () => {
      try {
        await fetch(`/api/developers/${id}`, { method: 'DELETE' })
        showToast('Desarrollador eliminado', 'success')
        fetchDevelopers()
      } catch { showToast('Error al eliminar', 'error') }
    })
  }

  // ── QAs ───────────────────────────────────
  const handleCreateQA = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingQA(true)
    try {
      const res = await fetch('/api/qas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(qaForm) })
      const data = await res.json()
      if (data.success) {
        showToast('QA creado exitosamente', 'success')
        setShowQAForm(false)
        setQAForm({ name: '', email: '', celulaId: '' })
        fetchQAs()
      } else showToast(data.error, 'error')
    } catch { showToast('Error al crear QA', 'error') }
    finally { setLoadingQA(false) }
  }
  const handleDeleteQA = (id: string, name: string) => {
    showConfirm(`¿Eliminar al QA "${name}"?`, async () => {
      try {
        await fetch(`/api/qas/${id}`, { method: 'DELETE' })
        showToast('QA eliminado', 'success')
        fetchQAs()
      } catch { showToast('Error al eliminar', 'error') }
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestiona sistemas, células, desarrolladores y QAs</p>
          </div>
        </div>

        {/* ─────────── CÉLULAS ─────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-800">Células</h2>
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">{celulas.length}</span>
            </div>
            <button onClick={() => setShowCelulaForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Nueva Célula
            </button>
          </div>

          {celulas.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay células registradas</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {celulas.map((cel) => (
                <div key={cel.id} className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {cel.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{cel.name}</span>
                  </div>
                  <button onClick={() => handleDeleteCelula(cel.id, cel.name)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─────────── DESARROLLADORES ─────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Desarrolladores</h2>
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{developers.length}</span>
            </div>
            <button onClick={() => setShowDevForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Nuevo Desarrollador
            </button>
          </div>

          {developers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay desarrolladores registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Correo</th>
                    <th className="pb-3 font-medium">Célula</th>
                    <th className="pb-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {developers.map((dev) => (
                    <tr key={dev.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{dev.name}</td>
                      <td className="py-3 text-gray-600">{dev.email || '—'}</td>
                      <td className="py-3">
                        {dev.celula ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">{dev.celula.name}</span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDeleteDev(dev.id, dev.name)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─────────── QAS ─────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TestTube2 className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">QAs</h2>
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">{qas.length}</span>
            </div>
            <button onClick={() => setShowQAForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Nuevo QA
            </button>
          </div>

          {qas.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay QAs registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Correo</th>
                    <th className="pb-3 font-medium">Célula</th>
                    <th className="pb-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {qas.map((qa) => (
                    <tr key={qa.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{qa.name}</td>
                      <td className="py-3 text-gray-600">{qa.email || '—'}</td>
                      <td className="py-3">
                        {qa.celula ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">{qa.celula.name}</span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDeleteQA(qa.id, qa.name)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─────────── SISTEMAS ─────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Sistemas y Módulos</h2>
            <button onClick={() => setShowSystemForm(!showSystemForm)} className="btn-primary">
              <Plus className="h-4 w-4" /> Nuevo Sistema
            </button>
          </div>

          {showSystemForm && (
            <form onSubmit={handleCreateSystem} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                  <input type="text" value={systemForm.name} onChange={(e) => setSystemForm({ ...systemForm, name: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input type="color" value={systemForm.color} onChange={(e) => setSystemForm({ ...systemForm, color: e.target.value })} className="input-field h-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea value={systemForm.description} onChange={(e) => setSystemForm({ ...systemForm, description: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loadingSys} className="btn-primary">{loadingSys ? 'Creando...' : 'Crear Sistema'}</button>
                <button type="button" onClick={() => setShowSystemForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {systems.map((system) => (
              <div key={system.id} className="p-4 border border-gray-200 rounded-lg hover:border-afex-green transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: system.color }}>
                      {system.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{system.name}</h3>
                      <p className="text-sm text-gray-500">{system.description}</p>
                    </div>
                  </div>
                  <button onClick={() => { setModuleForm({ ...moduleForm, systemId: system.id }); setShowModuleForm(true) }} className="btn-secondary text-sm">
                    <Plus className="h-4 w-4 inline mr-1" />Agregar Módulo
                  </button>
                </div>
                {system.modules && system.modules.length > 0 && (
                  <div className="mt-3 ml-13 flex flex-wrap gap-2">
                    {system.modules.map((mod: any) => (
                      <span key={mod.id} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">{mod.name}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Modals ─── */}

      {showCelulaForm && (
        <Modal title="Nueva Célula" onClose={() => setShowCelulaForm(false)}>
          <form onSubmit={handleCreateCelula} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={celulaForm.name} onChange={(e) => setCelulaForm({ name: e.target.value })} className="input-field" placeholder="Ej: Giros, Cambios, Pagos" required />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loadingCel} className="btn-primary flex-1">{loadingCel ? 'Creando...' : 'Crear Célula'}</button>
              <button type="button" onClick={() => setShowCelulaForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {showDevForm && (
        <Modal title="Nuevo Desarrollador" onClose={() => setShowDevForm(false)}>
          <form onSubmit={handleCreateDev} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={devForm.name} onChange={(e) => setDevForm({ ...devForm, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input type="email" value={devForm.email} onChange={(e) => setDevForm({ ...devForm, email: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Célula</label>
              <select value={devForm.celulaId} onChange={(e) => setDevForm({ ...devForm, celulaId: e.target.value })} className="input-field">
                <option value="">Sin célula</option>
                {celulas.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loadingDev} className="btn-primary flex-1">{loadingDev ? 'Creando...' : 'Crear Desarrollador'}</button>
              <button type="button" onClick={() => setShowDevForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {showQAForm && (
        <Modal title="Nuevo QA" onClose={() => setShowQAForm(false)}>
          <form onSubmit={handleCreateQA} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={qaForm.name} onChange={(e) => setQAForm({ ...qaForm, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input type="email" value={qaForm.email} onChange={(e) => setQAForm({ ...qaForm, email: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Célula</label>
              <select value={qaForm.celulaId} onChange={(e) => setQAForm({ ...qaForm, celulaId: e.target.value })} className="input-field">
                <option value="">Sin célula</option>
                {celulas.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loadingQA} className="btn-primary flex-1">{loadingQA ? 'Creando...' : 'Crear QA'}</button>
              <button type="button" onClick={() => setShowQAForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {showModuleForm && (
        <Modal title="Nuevo Módulo" onClose={() => { setShowModuleForm(false); setModuleForm({ name: '', description: '', systemId: '' }) }}>
          <form onSubmit={handleCreateModule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sistema</label>
              <select value={moduleForm.systemId} onChange={(e) => setModuleForm({ ...moduleForm, systemId: e.target.value })} className="input-field" required>
                <option value="">Selecciona un sistema</option>
                {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
              <input type="text" value={moduleForm.name} onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} className="input-field" rows={2} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loadingSys} className="btn-primary">{loadingSys ? 'Creando...' : 'Crear Módulo'}</button>
              <button type="button" onClick={() => { setShowModuleForm(false); setModuleForm({ name: '', description: '', systemId: '' }) }} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
