import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse } from '@shared/types'

// ── Constants ────────────────────────────────────────────────

const RETENTION_DAYS = 90

const TABS = [
  { key: 'academic_year', label: 'Academic Years' },
  { key: 'semester', label: 'Semesters' },
  { key: 'personnel', label: 'Personnel' },
  { key: 'room', label: 'Rooms' },
  { key: 'section', label: 'Sections' },
  { key: 'schedule_entry', label: 'Schedule Entries' },
  { key: 'calendar_event', label: 'Calendar Events' }
] as const

type EntityType = (typeof TABS)[number]['key']

interface ArchivedItem {
  id: string
  name?: string
  code?: string
  title?: string
  label?: string
  archived_at: string
  [key: string]: unknown
}

// ── Helpers ──────────────────────────────────────────────────

function getDisplayName(item: ArchivedItem): string {
  return (
    item.name ??
    item.code ??
    item.title ??
    item.label ??
    item.id.slice(0, 8)
  )
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function daysUntilPurge(archivedAt: string): number {
  return Math.max(0, RETENTION_DAYS - daysSince(archivedAt))
}

// ── Component ────────────────────────────────────────────────

export default function TrashPage(): JSX.Element {
  const toast = useToast()
  const { confirm } = useConfirmDialog()

  const [activeTab, setActiveTab] = useState<EntityType>('academic_year')
  const [items, setItems] = useState<ArchivedItem[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // ── Data fetching ────────────────────────────────────────

  const loadCounts = useCallback(async () => {
    const res = (await window.electronAPI.trashCounts()) as IpcResponse<Record<string, number>>
    if (res.data) setCounts(res.data)
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    const res = (await window.electronAPI.trashList({
      entityType: activeTab
    })) as IpcResponse<ArchivedItem[]>
    if (res.data) setItems(res.data)
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // ── Actions ──────────────────────────────────────────────

  const handleRestore = async (item: ArchivedItem): Promise<void> => {
    const res = (await window.electronAPI.trashRestore({
      entityType: activeTab,
      id: item.id
    })) as IpcResponse

    if (res.error) {
      toast.error(`Failed to restore: ${res.error.message}`)
      return
    }

    toast.success(`Restored "${getDisplayName(item)}"`)
    loadItems()
    loadCounts()
  }

  const handlePermanentDelete = async (item: ArchivedItem): Promise<void> => {
    const confirmed = await confirm({
      title: 'Permanently Delete',
      message: `Are you sure you want to permanently delete "${getDisplayName(item)}"? This cannot be undone.`,
      confirmLabel: 'Delete Permanently',
      variant: 'danger'
    })

    if (!confirmed) return

    const res = (await window.electronAPI.trashPermanentDelete({
      entityType: activeTab,
      id: item.id
    })) as IpcResponse

    if (res.error) {
      toast.error(`Failed to delete: ${res.error.message}`)
      return
    }

    toast.success(`Permanently deleted "${getDisplayName(item)}"`)
    loadItems()
    loadCounts()
  }

  const handlePurgeExpired = async (): Promise<void> => {
    const confirmed = await confirm({
      title: 'Empty Trash',
      message:
        'This will permanently delete all items that have been in the trash for more than 90 days. This cannot be undone.',
      confirmLabel: 'Purge Expired Items',
      variant: 'danger'
    })

    if (!confirmed) return

    const res = (await window.electronAPI.trashPurgeExpired()) as IpcResponse<{ purged: number; skippedReferenced: number }>

    if (res.error) {
      toast.error(`Failed to purge: ${res.error.message}`)
      return
    }

    const purged = res.data?.purged ?? 0
    const skipped = res.data?.skippedReferenced ?? 0
    const msg = skipped > 0
      ? `Purged ${purged} expired items. ${skipped} items skipped (still referenced by active schedules).`
      : `Purged ${purged} expired items`
    toast.success(msg)
    loadItems()
    loadCounts()
  }

  // ── Total count ──────────────────────────────────────────

  const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0)

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Trash</h1>
          <p className="text-sm text-surface-500 mt-1">
            Items are automatically purged after {RETENTION_DAYS} days
          </p>
        </div>
        <button
          onClick={handlePurgeExpired}
          disabled={totalCount === 0}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Empty Trash
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200 overflow-x-auto">
        {TABS.map((tab) => {
          const count = counts[tab.key] ?? 0
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-surface-100 text-surface-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-surface-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-surface-400">
          No archived items in this category.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">
                  Archived Date
                </th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">
                  Days Until Purge
                </th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {items.map((item) => {
                const remaining = daysUntilPurge(item.archived_at)
                return (
                  <tr key={item.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-surface-800">
                      {getDisplayName(item)}
                    </td>
                    <td className="px-4 py-3 text-surface-500 text-xs whitespace-nowrap">
                      {new Date(item.archived_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          remaining <= 7
                            ? 'bg-red-100 text-red-700'
                            : remaining <= 30
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-surface-100 text-surface-600'
                        }`}
                      >
                        {remaining === 0 ? 'Expired' : `${remaining} days`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleRestore(item)}
                          className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md border border-primary-200 transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item)}
                          className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors"
                        >
                          Delete Permanently
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
