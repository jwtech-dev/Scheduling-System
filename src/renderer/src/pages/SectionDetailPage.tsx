import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, Section, Semester, SubjectBankEntry } from '@shared/types'

export default function SectionDetailPage(): JSX.Element {
  const { sectionCode } = useParams<{ sectionCode: string }>()
  const navigate = useNavigate()
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [semesterMap, setSemesterMap] = useState<Map<string, string>>(new Map())
  const [semesters, setSemesters] = useState<Semester[]>([])

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ subject: '', semester_id: '', student_count: 30 })
  const [subjectBankItems, setSubjectBankItems] = useState<SubjectBankEntry[]>([])
  const [subjectSearch, setSubjectSearch] = useState('')
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)

  const decoded = sectionCode ? decodeURIComponent(sectionCode) : ''

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listSections({ department })) as IpcResponse<Section[]>
    if (result.data) {
      setSections(result.data.filter(s => s.section_code === decoded))
    }
    setLoading(false)
  }, [department, decoded])

  useEffect(() => { load() }, [load])

  // Load semesters
  useEffect(() => {
    (async () => {
      const result = (await window.electronAPI.getActiveTerm(department)) as IpcResponse<{ academicYear: { id: string } | null; semester: { id: string } | null }>
      if (result.data?.academicYear) {
        const semRes = (await window.electronAPI.getAcademicYearSemesters(result.data.academicYear.id)) as IpcResponse<Semester[]>
        if (semRes.data) {
          setSemesters(semRes.data)
          const map = new Map<string, string>()
          for (const sem of semRes.data) {
            const label = sem.semester_type === '1ST_SEMESTER' ? '1st Semester'
              : sem.semester_type === '2ND_SEMESTER' ? '2nd Semester'
              : sem.semester_type === 'SUMMER' ? 'Summer' : sem.semester_type
            map.set(sem.id, label)
          }
          setSemesterMap(map)
        }
      }
    })()
  }, [department])

  // Load subject bank for edit dropdown
  useEffect(() => {
    (async () => {
      const result = (await window.electronAPI.listSubjectBank({ department })) as IpcResponse<SubjectBankEntry[]>
      if (result.data) setSubjectBankItems(result.data)
    })()
  }, [department])

  // Representative info (first entry)
  const rep = sections[0]

  // Group subjects by semester — use semester_type directly (new global sections)
  // Fall back to semesterMap lookup for older records that still have semester_id
  const subjectsBySemester = useMemo(() => {
    const groups: Record<string, Section[]> = {}
    for (const s of sections) {
      let semLabel: string
      if (s.semester_type) {
        semLabel = s.semester_type === '1ST' ? '1st Semester'
          : s.semester_type === '2ND' ? '2nd Semester'
          : s.semester_type === 'SUMMER' ? 'Summer' : s.semester_type
      } else {
        semLabel = semesterMap.get(s.semester_id ?? '') || 'Unknown'
      }
      if (!groups[semLabel]) groups[semLabel] = []
      groups[semLabel].push(s)
    }
    return groups
  }, [sections, semesterMap])

  const startEdit = (s: Section) => {
    setEditingId(s.id)
    setEditForm({ subject: s.subject ?? '', semester_id: s.semester_id, student_count: s.student_count })
    setSubjectSearch('')
  }

  const cancelEdit = () => { setEditingId(null); setSubjectSearch('') }

  const handleSave = async (s: Section) => {
    const result = (await window.electronAPI.updateSection({
      id: s.id,
      ...s,
      subject: editForm.subject || null,
      semester_id: editForm.semester_id,
      student_count: editForm.student_count
    })) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Updated'); setEditingId(null); load() }
  }

  const handleDelete = async (id: string, label: string) => {
    const confirmed = await confirm({
      title: 'Delete Section Entry',
      message: `Delete "${label}"? This cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteSection(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else {
      toast.success('Deleted')
      // If last entry, go back to sections list
      if (sections.length <= 1) navigate('/sections')
      else load()
    }
  }

  if (loading) return <div className="p-8 text-center text-surface-400">Loading...</div>
  if (!rep) return (
    <div className="p-8 text-center">
      <p className="text-surface-400 mb-4">Section "{decoded}" not found.</p>
      <button onClick={() => navigate('/sections')} className="text-primary-600 hover:text-primary-800 font-medium">← Back to Sections</button>
    </div>
  )

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sections')} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors">
          <span>←</span> Back to Sections
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
        <div className="flex items-center gap-4 mb-1">
          <span className="text-2xl">📁</span>
          <div>
            <h1 className="text-xl font-bold text-surface-900">{rep.section_code}</h1>
            {rep.section_name && <p className="text-surface-500 text-sm">{rep.section_name}</p>}
          </div>
          <span className={`ml-auto inline-flex px-3 py-1 rounded-full text-xs font-semibold ${rep.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>{rep.status}</span>
        </div>
        <div className="flex items-center gap-6 mt-3 text-sm text-surface-500">
          <span><strong className="text-surface-700">{department === 'SHS' ? 'Strand/Track' : 'Course/Program'}:</strong> {department === 'SHS' ? rep.strand_track : rep.course_program}</span>
          <span><strong className="text-surface-700">Year Level:</strong> {rep.year_level}</span>
          <span><strong className="text-surface-700">Students:</strong> {rep.student_count}</span>
          <span><strong className="text-surface-700">Subjects:</strong> {sections.filter(s => s.subject).length}</span>
        </div>
      </div>

      {/* Subjects grouped by semester */}
      {Object.keys(subjectsBySemester).length === 0 ? (
        <div className="text-center py-12 text-surface-400">No subjects assigned to this section.</div>
      ) : (
        Object.entries(subjectsBySemester).sort(([a], [b]) => a.localeCompare(b)).map(([semLabel, entries]) => (
          <div key={semLabel} className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-surface-50 border-b border-surface-200 flex items-center gap-2">
              <span className="text-sm">{semLabel === '1st Semester' ? '📗' : semLabel === '2nd Semester' ? '📘' : '📙'}</span>
              <h3 className="text-sm font-semibold text-surface-700">{semLabel}</h3>
              <span className="text-xs text-surface-400">({entries.length} {entries.length === 1 ? 'subject' : 'subjects'})</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-50/50">
                <tr>
                  <th className="text-left px-5 py-2 font-medium text-surface-500 text-xs w-1/2">Subject</th>
                  <th className="text-left px-4 py-2 font-medium text-surface-500 text-xs">Semester</th>
                  <th className="text-left px-4 py-2 font-medium text-surface-500 text-xs">Students</th>
                  <th className="text-right px-5 py-2 font-medium text-surface-500 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {entries.map(s => (
                  <tr key={s.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-5 py-3 text-surface-700">
                      {editingId === s.id ? (
                        <div className="relative">
                          <input type="text" value={subjectSearch || editForm.subject} onChange={(e) => { setSubjectSearch(e.target.value); setEditForm({ ...editForm, subject: e.target.value }); setShowSubjectDropdown(true) }} onFocus={() => setShowSubjectDropdown(true)} onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)} className="w-full px-2 py-1 border border-surface-300 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                          {showSubjectDropdown && (() => {
                            const q = (subjectSearch || editForm.subject).toLowerCase()
                            const filtered = subjectBankItems.filter(sb => !q || sb.subject_name.toLowerCase().includes(q) || sb.subject_code.toLowerCase().includes(q)).slice(0, 8)
                            return filtered.length > 0 ? (
                              <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                                {filtered.map(sb => (
                                  <button key={sb.id} type="button" onMouseDown={() => { setEditForm({ ...editForm, subject: sb.subject_name }); setSubjectSearch(''); setShowSubjectDropdown(false) }} className="w-full text-left px-3 py-1.5 hover:bg-primary-50 text-sm">{sb.subject_name} <span className="text-xs text-surface-400">{sb.subject_code}</span></button>
                                ))}
                              </div>
                            ) : null
                          })()}
                        </div>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="text-surface-400">📄</span>
                          {s.subject || <span className="text-surface-400 italic">No subject</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500">
                      {editingId === s.id ? (
                        <select value={editForm.semester_id} onChange={(e) => setEditForm({ ...editForm, semester_id: e.target.value })} className="px-2 py-1 border border-surface-300 rounded text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none">
                          {semesters.map(sem => <option key={sem.id} value={sem.id}>{semesterMap.get(sem.id)}</option>)}
                        </select>
                      ) : (
                        s.semester_type
                          ? (s.semester_type === '1ST' ? '1st Semester' : s.semester_type === '2ND' ? '2nd Semester' : 'Summer')
                          : semesterMap.get(s.semester_id ?? '') || '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500">
                      {editingId === s.id ? (
                        <input type="number" value={editForm.student_count} onChange={(e) => setEditForm({ ...editForm, student_count: parseInt(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-surface-300 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none" min={1} />
                      ) : s.student_count}
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      {editingId === s.id ? (
                        <>
                          <button onClick={() => handleSave(s)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                          <button onClick={cancelEdit} className="text-surface-500 hover:text-surface-700 text-xs font-medium">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(s)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(s.id, s.section_code + (s.subject ? ` — ${s.subject}` : ''))} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
