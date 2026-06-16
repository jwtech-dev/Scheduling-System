import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { type HelpItem } from '../constants/helpContent'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  content: HelpItem | null
}

export default function HelpModal({ isOpen, onClose, content }: HelpModalProps): JSX.Element | null {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !content) return null

  const handleLinkClick = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with fade-in animation */}
      <div
        className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Centered Modal Container with slide-up and scale-in animation */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-surface-200 w-full max-w-lg overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col z-10 animate-scale-up">
        {/* Header - Vibrant modern gradient */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Help & Instructions</h2>
              <p className="text-white/80 text-xs mt-0.5">{content.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors duration-150"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[calc(90vh-140px)]">
          {/* Purpose Section */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-surface-400 uppercase tracking-widest">Purpose</h3>
            <div className="bg-gradient-to-br from-surface-50 to-surface-100 p-4 rounded-xl border border-surface-200/60 shadow-inner">
              <p className="text-sm text-surface-700 leading-relaxed font-medium">
                {content.purpose}
              </p>
            </div>
          </div>

          {/* Steps / Instructions Section */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-surface-400 uppercase tracking-widest">How to Use</h3>
            <ol className="space-y-4">
              {content.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3.5 items-start text-sm text-surface-600 leading-relaxed group">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-50 text-primary-600 font-extrabold text-xs flex items-center justify-center mt-0.5 border border-primary-100 group-hover:bg-primary-100 transition-colors duration-150">
                    {idx + 1}
                  </span>
                  <span className="font-medium pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Quick Links Section */}
          {content.links && content.links.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-surface-100">
              <h3 className="text-[11px] font-bold text-surface-400 uppercase tracking-widest">Related Sections</h3>
              <div className="flex flex-wrap gap-2.5">
                {content.links.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleLinkClick(link.path)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-xs font-bold transition-all duration-150 border border-indigo-100/50 hover:border-indigo-200 hover:-translate-y-0.5 shadow-sm active:translate-y-0"
                  >
                    <span>{link.label}</span>
                    <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-100 bg-surface-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-200 hover:bg-surface-300 text-surface-700 hover:text-surface-900 rounded-xl text-xs font-bold transition-colors duration-150 shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}
