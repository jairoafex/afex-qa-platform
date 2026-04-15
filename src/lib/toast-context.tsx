'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void
  showLoading: (message?: string) => void
  hideLoading: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string
    onConfirm: () => void
    onCancel?: () => void
  } | null>(null)
  const [loadingState, setLoadingState] = useState<{ message: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType, duration: number = 0) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])

    // Auto-close solo si se especifica duración
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }, duration)
    }
  }, [])

  const showLoading = useCallback((message: string = 'Procesando...') => {
    setLoadingState({ message })
  }, [])

  const hideLoading = useCallback(() => {
    setLoadingState(null)
  }, [])

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setConfirmDialog({ message, onConfirm, onCancel })
  }, [])

  const handleConfirm = () => {
    if (confirmDialog) {
      confirmDialog.onConfirm()
      setConfirmDialog(null)
    }
  }

  const handleCancel = () => {
    if (confirmDialog) {
      confirmDialog.onCancel?.()
      setConfirmDialog(null)
    }
  }

  return (
    <>
      <ToastContext.Provider value={{ toasts, showToast, removeToast, showConfirm, showLoading, hideLoading }}>
        {children}
      </ToastContext.Provider>
      
      {/* Toast Modals - Renderizado como Portal solo en cliente */}
      {mounted && typeof window !== 'undefined' && toasts.length > 0 && createPortal(
        <ToastModal toast={toasts[0]} onRemove={removeToast} />,
        document.body
      )}

      {/* Confirmation Dialog - Renderizado como Portal solo en cliente */}
      {mounted && typeof window !== 'undefined' && confirmDialog && createPortal(
        <ConfirmationDialog
          message={confirmDialog.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />,
        document.body
      )}

      {/* Loading Modal */}
      {mounted && typeof window !== 'undefined' && loadingState && createPortal(
        <LoadingModal message={loadingState.message} />,
        document.body
      )}
    </>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// Toast Modal Component (centrado como confirmación)
function ToastModal({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: (
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    warning: (
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100">
        <svg className="h-10 w-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    info: (
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
        <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }

  const titles = {
    success: 'Operación exitosa',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información'
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn" onClick={() => onRemove(toast.id)}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 text-center">
          {icons[toast.type]}
          <h3 className="text-2xl font-bold text-gray-900 mt-5 mb-3">{titles[toast.type]}</h3>
          <p className="text-base text-gray-600 leading-relaxed">{toast.message}</p>
        </div>
        <div className="px-8 pb-8 flex justify-center">
          {toast.type === 'success' && (
            <button
              onClick={() => onRemove(toast.id)}
              className="px-10 py-3.5 text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Entendido
            </button>
          )}
          {toast.type === 'error' && (
            <button
              onClick={() => onRemove(toast.id)}
              className="px-10 py-3.5 text-base font-bold text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Entendido
            </button>
          )}
          {toast.type === 'warning' && (
            <button
              onClick={() => onRemove(toast.id)}
              className="px-10 py-3.5 text-base font-bold text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Entendido
            </button>
          )}
          {toast.type === 'info' && (
            <button
              onClick={() => onRemove(toast.id)}
              className="px-10 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading Modal Component
function LoadingModal({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-afex-green"></div>
          <p className="mt-4 text-gray-700 font-medium text-center">{message}</p>
        </div>
      </div>
    </div>
  )
}

/* Old Toast Notification Component (ahora sin uso) - Conservado para referencia futura
function ToastNotification({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: (
      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-orange-50 border-orange-200',
    info: 'bg-blue-50 border-blue-200'
  }

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-orange-800',
    info: 'text-blue-800'
  }

  return (
    <div
      className={`${bgColors[toast.type]} ${textColors[toast.type]} px-6 py-4 rounded-lg border-2 shadow-2xl flex items-start gap-3 min-w-[350px] max-w-md pointer-events-auto animate-slideIn`}
      role="alert"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      <p className="flex-1 text-sm font-semibold leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Cerrar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
*/

// Confirmation Dialog Component
function ConfirmationDialog({
  message,
  onConfirm,
  onCancel
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-scaleIn">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar acción</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
