// ============================================================
// Header Mapper — Smart Column Matching for Subject Bank Import
// ============================================================
// Fuzzy-matches file headers to target fields using alias maps,
// normalized matching, and Levenshtein distance scoring.

export interface FieldDef {
  key: string
  label: string
  required: boolean
  aliases: string[]
}

export interface ColumnMapping {
  sourceHeader: string
  targetField: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  score: number
}

/** Subject Bank target field definitions with comprehensive alias maps. */
export const SUBJECT_BANK_FIELDS: FieldDef[] = [
  {
    key: 'subject_code',
    label: 'Subject Code',
    required: false,
    aliases: [
      'subject_code', 'subject code', 'subj_code', 'subj code',
      'course_code', 'course code', 'code',
      'subject no', 'subject_no', 'subj no', 'course no', 'course_no',
      'subject number', 'course number'
    ]
  },
  {
    key: 'subject_name',
    label: 'Subject Name',
    required: true,
    aliases: [
      'subject_name', 'subject name', 'subject_title', 'subject title',
      'course_title', 'course title', 'course_name', 'course name',
      'descriptive_title', 'descriptive title', 'description_title', 'description title',
      'title', 'name', 'subject', 'course', 'courses',
      'subject description', 'course description',
      'descriptive', 'desc title', 'desc_title'
    ]
  },
  {
    key: 'course_program',
    label: 'Course/Program',
    required: false,
    aliases: [
      'course_program', 'course program', 'program', 'curriculum',
      'course', 'program_code', 'program code', 'degree',
      'degree_program', 'degree program', 'strand', 'track'
    ]
  },
  {
    key: 'year_level',
    label: 'Year Level',
    required: false,
    aliases: [
      'year_level', 'year level', 'year', 'yr_level', 'yr level',
      'yr', 'level', 'grade_level', 'grade level', 'grade',
      'year_lvl', 'year lvl'
    ]
  },
  {
    key: 'semester_type',
    label: 'Semester',
    required: false,
    aliases: [
      'semester_type', 'semester type', 'semester', 'sem',
      'sem_type', 'sem type', 'term', 'period'
    ]
  },
  {
    key: 'lec_units',
    label: 'Lecture Units',
    required: false,
    aliases: [
      'lec_units', 'lec units', 'lec', 'lecture', 'lecture_units', 'lecture units',
      'lec_hrs', 'lec hrs', 'lecture_hrs', 'lecture hrs',
      'lec_hours', 'lec hours', 'lecture_hours', 'lecture hours',
      'no. of hours lec', 'no of hours lec', 'hrs lec'
    ]
  },
  {
    key: 'lab_units',
    label: 'Laboratory Units',
    required: false,
    aliases: [
      'lab_units', 'lab units', 'lab', 'laboratory', 'laboratory_units', 'laboratory units',
      'lab_hrs', 'lab hrs', 'laboratory_hrs', 'laboratory hrs',
      'lab_hours', 'lab hours', 'laboratory_hours', 'laboratory hours',
      'no. of hours lab', 'no of hours lab', 'hrs lab'
    ]
  },
  {
    key: 'pre_requisites',
    label: 'Pre-requisites',
    required: false,
    aliases: [
      'pre_requisites', 'pre requisites', 'prerequisites', 'pre-requisites',
      'prereq', 'pre_req', 'pre req', 'pre-req',
      'prerequisite', 'pre-requisite', 'pre_requisite',
      'required_courses', 'required courses', 'prereqs'
    ]
  }
]

/**
 * Normalize a header string for comparison:
 * lowercase, trim, collapse whitespace, strip special chars.
 */
function normalize(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-./]+/g, ' ')   // Replace separators with spaces
    .replace(/[^a-z0-9 ]/g, '')  // Strip remaining special chars
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim()
}

/**
 * Compute Levenshtein distance between two strings.
 * Uses dynamic programming with O(min(a,b)) space.
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) { const t = a; a = b; b = t }

  const aLen = a.length
  const bLen = b.length
  let prev = new Array(aLen + 1)
  let curr = new Array(aLen + 1)

  for (let i = 0; i <= aLen; i++) prev[i] = i

  for (let j = 1; j <= bLen; j++) {
    curr[0] = j
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[i] = Math.min(
        curr[i - 1] + 1,     // insertion
        prev[i] + 1,         // deletion
        prev[i - 1] + cost   // substitution
      )
    }
    const tmp = prev; prev = curr; curr = tmp
  }

  return prev[aLen]
}

/**
 * Score a file header against a target field definition.
 * Returns a score from 0 to 100.
 *
 * Scoring tiers:
 * - 100: Exact alias match
 * -  90: Normalized match (after stripping separators/special chars)
 * -  70: Source contains alias or alias contains source (substring)
 * - 0-60: Levenshtein similarity (for typos/close matches)
 */
function scoreMatch(sourceHeader: string, field: FieldDef): number {
  const srcNorm = normalize(sourceHeader)
  if (!srcNorm) return 0

  let bestScore = 0

  for (const alias of field.aliases) {
    const aliasNorm = normalize(alias)

    // Tier 1: Exact normalized match
    if (srcNorm === aliasNorm) return 100

    // Tier 2: One contains the other (substring match)
    if (srcNorm.length >= 3 && aliasNorm.length >= 3) {
      if (srcNorm.includes(aliasNorm) || aliasNorm.includes(srcNorm)) {
        const containScore = 70
        if (containScore > bestScore) bestScore = containScore
        continue
      }
    }

    // Tier 3: Levenshtein-based similarity
    const maxLen = Math.max(srcNorm.length, aliasNorm.length)
    if (maxLen > 0) {
      const dist = levenshtein(srcNorm, aliasNorm)
      const similarity = 1 - dist / maxLen
      // Only consider if similarity is reasonable (> 0.5)
      if (similarity > 0.5) {
        const levScore = Math.round(similarity * 60)
        if (levScore > bestScore) bestScore = levScore
      }
    }
  }

  return bestScore
}

/**
 * Map file headers to Subject Bank target fields using fuzzy matching.
 *
 * Algorithm:
 * 1. Score every (source, target) pair.
 * 2. Greedily assign best matches, resolving conflicts by keeping higher scores.
 * 3. Unmatched sources get targetField=null, confidence='none'.
 */
export function fuzzyMatchHeaders(
  fileHeaders: string[],
  fields: FieldDef[] = SUBJECT_BANK_FIELDS
): ColumnMapping[] {
  // Build score matrix: [sourceIndex][fieldIndex] = score
  const scores: number[][] = fileHeaders.map(header =>
    fields.map(field => scoreMatch(header, field))
  )

  // Collect all (score, sourceIndex, fieldIndex) pairs, sorted descending by score
  const candidates: Array<{ score: number; srcIdx: number; fldIdx: number }> = []
  for (let s = 0; s < fileHeaders.length; s++) {
    for (let f = 0; f < fields.length; f++) {
      if (scores[s][f] > 0) {
        candidates.push({ score: scores[s][f], srcIdx: s, fldIdx: f })
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score)

  // Greedy assignment: each source and field can only be used once
  const sourceAssigned = new Set<number>()
  const fieldAssigned = new Set<number>()
  const assignments = new Map<number, { fieldIdx: number; score: number }>()

  for (const { score, srcIdx, fldIdx } of candidates) {
    if (sourceAssigned.has(srcIdx) || fieldAssigned.has(fldIdx)) continue
    assignments.set(srcIdx, { fieldIdx: fldIdx, score })
    sourceAssigned.add(srcIdx)
    fieldAssigned.add(fldIdx)
  }

  // Build result
  return fileHeaders.map((header, idx) => {
    const assignment = assignments.get(idx)
    if (!assignment) {
      return { sourceHeader: header, targetField: null, confidence: 'none' as const, score: 0 }
    }

    const confidence: ColumnMapping['confidence'] =
      assignment.score >= 90 ? 'high' :
      assignment.score >= 60 ? 'medium' :
      assignment.score >= 30 ? 'low' : 'none'

    return {
      sourceHeader: header,
      targetField: fields[assignment.fieldIdx].key,
      confidence,
      score: assignment.score
    }
  })
}

/**
 * Apply confirmed column mappings to remap row data.
 * Takes the raw parsed rows (keyed by original file headers) and returns
 * rows re-keyed to the target field names.
 */
export function applyMappings(
  rows: Record<string, string>[],
  mappings: ColumnMapping[]
): Record<string, string>[] {
  // Build source→target lookup from confirmed mappings
  const headerMap = new Map<string, string>()
  for (const m of mappings) {
    if (m.targetField) {
      headerMap.set(m.sourceHeader.toLowerCase(), m.targetField)
    }
  }

  return rows.map(row => {
    const mapped: Record<string, string> = {}
    for (const [key, value] of Object.entries(row)) {
      const target = headerMap.get(key.toLowerCase())
      if (target) {
        mapped[target] = value
      }
      // Also preserve the original key so existing alias logic at commit time
      // still works as a safety net
      mapped[key] = value
    }
    return mapped
  })
}

/**
 * Detect whether raw cell data looks like a curriculum-format document
 * (has year/semester markers like "FIRST YEAR", "1st Semester", etc.)
 * rather than a simple tabular file with column headers.
 *
 * Key: markers must appear as **standalone section headings** (short rows
 * with ≤3 non-empty cells), not as incidental values inside data cells
 * or column headers. This avoids false positives from tabular files that
 * have a "Semester" header column and "1st Year" data values.
 */
export function isCurriculumFormat(allCells: string[][]): boolean {
  let hasYearMarker = false
  let hasSemesterMarker = false

  const yearPatterns = [
    /\bfirst\s+year\b/i, /\b1st\s+year\b/i,
    /\bsecond\s+year\b/i, /\b2nd\s+year\b/i,
    /\bthird\s+year\b/i, /\b3rd\s+year\b/i,
    /\bfourth\s+year\b/i, /\b4th\s+year\b/i
  ]

  const scanLimit = Math.min(allCells.length, 50)
  for (let r = 0; r < scanLimit; r++) {
    const nonEmpty = allCells[r].filter(c => c.trim())
    // Only consider short rows (≤3 non-empty cells) as potential section headings.
    // A tabular data row would typically have 4+ cells filled.
    if (nonEmpty.length === 0 || nonEmpty.length > 3) continue

    const rowText = nonEmpty.join(' ')

    for (const yp of yearPatterns) {
      if (yp.test(rowText)) { hasYearMarker = true; break }
    }
    if (/\b(1st|2nd|first|second)\s+semester\b/i.test(rowText)) {
      hasSemesterMarker = true
    }
    if (hasYearMarker && hasSemesterMarker) return true
  }

  return false
}
