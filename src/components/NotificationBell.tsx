'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Clock,
  Trophy,
  RefreshCw,
  X,
} from 'lucide-react'
import type { Notification, NotificationType } from '@/app/api/notifications/route'

const STORAGE_KEY = 'qa_notifications_last_seen'
const POLL_INTERVAL = 30_000 // 30 s

// ── Icono por tipo ─────────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: NotificationType }) {
  const map: Record<NotificationType, { icon: React.ElementType; bg: string; color: string }> = {
    created:        { icon: Plus,         bg: 'bg-blue-100',   color: 'text-blue-600'   },
    approved:       { icon: CheckCircle2, bg: 'bg-green-100',  color: 'text-green-600'  },
    failed:         { icon: XCircle,      bg: 'bg-red-100',    color: 'text-red-600'    },
    blocked:        { icon: AlertTriangle,bg: 'bg-orange-100', color: 'text-orange-600' },
    in_progress:    { icon: Clock,        bg: 'bg-blue-100',   color: 'text-blue-500'   },
    plan_completed: { icon: Trophy,       bg: 'bg-purple-100', color: 'text-purple-600' },
    status_change:  { icon: RefreshCw,    bg: 'bg-gray-100',   color: 'text-gray-500'   },
  }
  const { icon: Icon, bg, color } = map[type] ?? map.status_change
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${bg}`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </span>
  )
}

// ── timeAgo ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `hace ${d} día${d > 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getLastSeen = () => localStorage.getItem(STORAGE_KEY) ?? new Date(0).toISOString()

  const fetchNotifications = useCallback(async () => {
    try {
      const since = getLastSeen()
      const res = await fetch(`/api/notifications?since=${encodeURIComponent(since)}&limit=40`)
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      }
    } catch {
      // silencioso — no interrumpir UI
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial + polling
  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchNotifications])

  // Refetch al volver a la pestaña
  useEffect(() => {
    const onFocus = () => fetchNotifications()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchNotifications])

  // Cierre al click fuera
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => {
    setOpen((v) => !v)
  }

  const markAllRead = () => {
    const now = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, now)
    setUnreadCount(0)
  }

  // Cuando se abre el panel, marcar como leído automáticamente después de 2 s
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => markAllRead(), 2000)
    return () => clearTimeout(id)
  }, [open])

  // Separar leídas / no leídas para agrupar en el panel
  const lastSeen = getLastSeen()
  const unread = notifications.filter((n) => new Date(n.createdAt) > new Date(lastSeen))
  const read   = notifications.filter((n) => new Date(n.createdAt) <= new Date(lastSeen))

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón campana */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-0.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col max-h-[520px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-800 text-sm">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                  {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#034e30] hover:underline font-medium"
                >
                  Marcar leídas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#034e30]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Sin notificaciones</p>
                <p className="text-xs mt-1">Los eventos del equipo aparecerán aquí</p>
              </div>
            ) : (
              <>
                {/* No leídas */}
                {unread.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Nuevas
                    </p>
                    {unread.map((n) => (
                      <NotifRow key={n.id} n={n} isNew />
                    ))}
                  </div>
                )}

                {/* Anteriores */}
                {read.length > 0 && (
                  <div>
                    {unread.length > 0 && (
                      <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Anteriores
                      </p>
                    )}
                    {read.map((n) => (
                      <NotifRow key={n.id} n={n} isNew={false} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <p className="text-xs text-gray-400">
                Últimas {notifications.length} actividades del equipo
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Fila de notificación ───────────────────────────────────────────────────────
function NotifRow({ n, isNew }: { n: Notification; isNew: boolean }) {
  return (
    <Link
      href={n.testPlanId ? `/test-plans/${n.testPlanId}` : '#'}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${
        isNew ? 'bg-blue-50/40' : ''
      }`}
    >
      <NotifIcon type={n.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-sm font-medium truncate ${isNew ? 'text-gray-900' : 'text-gray-700'}`}>
            {n.title}
          </p>
          <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
            {timeAgo(n.createdAt)}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          <span className="font-medium text-gray-600">{n.testCaseCaseId}</span>
          {' – '}
          {n.testCaseName}
        </p>
        {n.testPlanJiraTask && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5">
            Plan: {n.testPlanJiraTask}
          </p>
        )}
        <p className="text-[11px] text-gray-400 mt-0.5">por {n.userName}</p>
      </div>
      {isNew && (
        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
      )}
    </Link>
  )
}
