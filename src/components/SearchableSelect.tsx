'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccione una opción',
  className = '',
  disabled = false,
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 10)
    }
  }, [isOpen])

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label ?? ''

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={[
          'w-full rounded-lg border bg-white text-left',
          'flex items-center justify-between gap-2',
          'px-3 py-2 text-sm transition-all duration-150',
          'focus:outline-none',
          disabled
            ? 'border-gray-200 opacity-60 cursor-not-allowed'
            : isOpen
            ? 'border-afex-green ring-2 ring-afex-green/20 cursor-pointer'
            : 'border-gray-200 hover:border-gray-300 cursor-pointer',
        ].join(' ')}
      >
        <span className={`flex-1 truncate ${displayValue ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayValue || placeholder}
        </span>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
              aria-label="Limpiar selección"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Panel desplegable ── */}
      {isOpen && !disabled && (
        <div className="
          absolute z-50 w-full mt-1.5 overflow-hidden
          bg-white rounded-xl
          border border-gray-200
          shadow-[0_8px_32px_rgba(0,0,0,0.10)]
          animate-scaleIn
        ">
          {/* Búsqueda interna */}
          <div className="px-2.5 pt-2.5 pb-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar opción..."
                className="
                  w-full pl-8 pr-3 py-1.5 text-sm rounded-lg
                  bg-gray-50 border border-gray-200
                  focus:outline-none focus:border-afex-green focus:ring-1 focus:ring-afex-green/20
                  placeholder:text-gray-400 placeholder:text-xs
                "
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="py-7 text-center">
                <Search className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  Sin resultados{searchTerm ? ` para "${searchTerm}"` : ''}
                </p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className={[
                      'w-full text-left px-3 py-2 rounded-lg text-sm',
                      'flex items-center justify-between gap-2',
                      'transition-colors duration-100',
                      isSelected
                        ? 'bg-green-50 text-afex-green font-medium'
                        : 'text-gray-700 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-afex-green" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer — solo si la lista es larga */}
          {options.length > 6 && (
            <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/60">
              <p className="text-[11px] text-gray-400">
                {filteredOptions.length === options.length
                  ? `${options.length} opciones`
                  : `${filteredOptions.length} de ${options.length}`}
              </p>
            </div>
          )}
        </div>
      )}

      <input type="hidden" value={value} required={required} />
    </div>
  )
}
