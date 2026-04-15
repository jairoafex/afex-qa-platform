'use client'

import { ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  TestTube,
  FolderKanban,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import NotificationBell from '@/components/NotificationBell'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afex-green"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Escenarios de Prueba', href: '/test-cases', icon: TestTube },
    { name: 'Casos de Prueba', href: '/test-plans', icon: FolderKanban },
    { name: 'Generar con IA', href: '/generate', icon: Sparkles, soon: true },
    { name: 'Métricas', href: '/metrics', icon: BarChart3, soon: true },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <Sidebar
              navigation={navigation}
              pathname={pathname}
              session={session}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar navigation={navigation} pathname={pathname} session={session} />
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
            <button
              className="lg:hidden text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1 flex justify-between items-center">
              <h1 className="text-sm font-semibold text-gray-500 tracking-wide hidden sm:block">
                {navigation.find((item) => item.href === pathname)?.name || ''}
              </h1>

              <div className="flex items-center gap-2 ml-auto">
                <NotificationBell />
                <div className="hidden sm:block text-right text-xs leading-tight">
                  <p className="font-semibold text-gray-700">{session.user?.name}</p>
                  <p className="text-gray-400">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

function Sidebar({
  navigation,
  pathname,
  session,
  onClose,
}: {
  navigation: any[]
  pathname: string
  session: any
  onClose?: () => void
}) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div className="flex flex-col gap-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 250 80"
            fill="none"
            className="h-8 w-auto"
            aria-label="AFEX"
          >
            <text
              x="0" y="68"
              fontFamily="Arial Black, Arial, Helvetica, sans-serif"
              fontWeight="900"
              fontSize="78"
              fill="#034e30"
              letterSpacing="-2"
            >AFEX</text>
            <rect x="234" y="2" width="14" height="14" rx="1.5" fill="#2ecc40" />
          </svg>
          <p className="text-xs text-gray-500 leading-tight pl-0.5">Portal de pruebas</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-600">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.soon) {
            return (
              <div
                key={item.name}
                title="Disponible próximamente"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed select-none"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                <span className="text-[10px] font-semibold tracking-wide bg-gray-100 text-gray-400 rounded-full px-2 py-0.5">
                  V2
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                isActive
                  ? 'bg-afex-green text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 font-medium'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer usuario */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-afex-green rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {session.user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {session.user?.name}
            </p>
            <p className="text-xs text-gray-400 leading-tight mt-0.5">{session.user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
