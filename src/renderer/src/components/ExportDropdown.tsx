import { useState, useRef, useEffect } from 'react'
import { useSignatoriesModal } from './SignatoriesModal'
import { useToast } from './ToastProvider'
import type { IpcResponse } from '@shared/types'

interface ExportDropdownProps {
  target: 'rooms' | 'personnel' | 'subjects' | 'sections' | 'programs'
  department?: string
  /** If provided, shows "Export Selected" options */
  selectedId?: string
  selectedLabel?: string
}

export default function ExportDropdown({ target, department, selectedId, selectedLabel }: ExportDropdownProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { openSignatoriesModal } = useSignatoriesModal()
  const toast = useToast()

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const doExport = async (format: 'csv' | 'pdf', id?: string) => {
    setOpen(false)
    setExporting(true)
    try {
      const modalResult = await openSignatoriesModal()
      if (modalResult === null) return // User cancelled the modal entirely

      // Filter out empty signatories
      const nonEmpty = modalResult.signatories.filter(g => g.label.trim() || g.entries.some(e => e.name.trim()))
      const signatories = nonEmpty.length > 0 ? nonEmpty : undefined
      const notes = modalResult.notes.length > 0 ? modalResult.notes : undefined

      const result = (await window.electronAPI.exportData({ target, format, department, id, signatories, notes })) as IpcResponse<{ success: boolean; path?: string }>
      if (result.error) { toast.error(result.error.message); return }
      if (result.data?.path) toast.success(`Exported to: ${result.data.path}`)
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const targetLabel = {
    rooms: 'Rooms',
    personnel: 'Personnel',
    subjects: 'Subjects',
    sections: 'Sections',
    programs: 'Programs'
  }[target]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
      >
        {exporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
            <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-surface-200 rounded-lg shadow-lg z-50 py-1 animate-[modal-dialog-in_0.15s_ease-out]">
          <div className="px-3 py-1.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Export All {targetLabel}</div>
          <button
            onClick={() => doExport('csv')}
            className="w-full text-left px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export as CSV
          </button>
          <button
            onClick={() => doExport('pdf')}
            className="w-full text-left px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Export as PDF (Legal)
          </button>

          {selectedId && (
            <>
              <div className="border-t border-surface-100 my-1" />
              <div className="px-3 py-1.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Export Selected</div>
              <button
                onClick={() => doExport('csv', selectedId)}
                className="w-full text-left px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {selectedLabel || 'Selected'} as CSV
              </button>
              <button
                onClick={() => doExport('pdf', selectedId)}
                className="w-full text-left px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                {selectedLabel || 'Selected'} as PDF
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
