import type { ConflictFlag } from '@shared/types'

interface ConflictPanelProps {
  conflicts: ConflictFlag[]
}

export default function ConflictPanel({ conflicts }: ConflictPanelProps): JSX.Element | null {
  if (conflicts.length === 0) return null

  const hardConflicts = conflicts.filter((c) => c.severity === 'HARD')
  const softConflicts = conflicts.filter((c) => c.severity === 'SOFT')

  return (
    <div className="space-y-3">
      {hardConflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {hardConflicts.length} Hard Conflict{hardConflicts.length > 1 ? 's' : ''} — Entry cannot be published
          </h3>
          <ul className="space-y-1">
            {hardConflicts.map((c, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                {c.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {softConflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {softConflicts.length} Warning{softConflicts.length > 1 ? 's' : ''}
          </h3>
          <ul className="space-y-1">
            {softConflicts.map((c, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                {c.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
