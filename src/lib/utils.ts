import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind CSS de manera inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha de manera legible
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Calcula el porcentaje
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Obtiene el color según el estado del escenario de prueba
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    FAILED: 'bg-red-100 text-red-700',
    BLOCKED: 'bg-orange-100 text-orange-700',
    OUT_OF_SCOPE: 'bg-gray-100 text-gray-500',
    APPROVED: 'bg-green-100 text-green-700',
    // legado
    CREATED: 'bg-purple-100 text-purple-700',
    PASSED: 'bg-green-100 text-green-700',
    SKIPPED: 'bg-yellow-100 text-yellow-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

/**
 * Obtiene el color según la prioridad
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-300',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    LOW: 'bg-green-100 text-green-700 border-green-300',
  }
  return colors[priority] || 'bg-gray-100 text-gray-700'
}

/**
 * Traduce valores al español
 */
export function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    PENDING: 'Por hacer',
    IN_PROGRESS: 'En progreso',
    FAILED: 'Fallido',
    BLOCKED: 'Bloqueado',
    OUT_OF_SCOPE: 'Fuera de alcance',
    APPROVED: 'Aprobado',
    // legado
    CREATED: 'Creado',
    PASSED: 'Exitoso',
    SKIPPED: 'Omitido',
    NOT_APPLICABLE: 'No Aplica',
    CANCELLED: 'Anulado',
  }
  return translations[status] || status
}

export function translatePriority(priority: string): string {
  const translations: Record<string, string> = {
    CRITICAL: 'Crítica',
    HIGH: 'Alta',
    MEDIUM: 'Media',
    LOW: 'Baja',
  }
  return translations[priority] || priority
}

export function translateTestType(type: string): string {
  const translations: Record<string, string> = {
    FUNCTIONAL: 'Funcional',
    INTEGRATION: 'Integración',
    REGRESSION: 'Regresión',
    SMOKE: 'Smoke',
    E2E: 'E2E',
    API: 'API',
    PERFORMANCE: 'Rendimiento',
    SECURITY: 'Seguridad',
    USABILITY: 'Usabilidad',
  }
  return translations[type] || type
}

/**
 * Trunca texto largo
 */
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Formatea tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
