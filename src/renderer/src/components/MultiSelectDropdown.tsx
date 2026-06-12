import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface MultiSelectDropdownProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  required?: boolean
  className?: string
}

/**
 * A dropdown with checkboxes for multi-select.
 * Replaces the native <select multiple> which is clunky and shows duplicates.
 */
export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = '— Select —',
  required = false,
  className = ''
}: MultiSelectDropdownProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const selectedLabels = options
    .filter(o => selected.includes(o.value))
    .map(o => o.label)

  const displayText = selectedLabels.length > 0
    ? selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`
    : placeholder

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Hidden native input for form required validation */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          value={selected.length > 0 ? 'valid' : ''}
          onChange={() => {}}
          required
        />
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2 border rounded-lg text-left text-sm flex items-center justify-between transition-colors ${
          open
            ? 'border-primary-500 ring-2 ring-primary-500'
            : 'border-surface-300 hover:border-surface-400'
        } ${selectedLabels.length === 0 ? 'text-surface-400' : 'text-surface-800'}`}
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`w-4 h-4 ml-2 flex-shrink-0 text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-surface-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-surface-400">No sections available</div>
          ) : (
            <>
              {/* Select All / Clear All */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-100">
                <button
                  type="button"
                  onClick={() => onChange(options.map(o => o.value))}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-surface-500 hover:text-surface-700 font-medium"
                >
                  Clear
                </button>
              </div>
              {options.map(option => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-surface-800">{option.label}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
