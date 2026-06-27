export interface HelpLink {
  label: string
  path: string
}

export interface HelpItem {
  title: string
  purpose: string
  steps: string[]
  links?: HelpLink[]
}

export const HELP_CONTENT: Record<string, HelpItem> = {
  '/': {
    title: 'Dashboard Overview',
    purpose: 'Get a high-level overview of scheduling activity, statistics, and quick navigation shortcuts.',
    steps: [
      'Check the statistics cards for total schedule entries, drafts, published schedules, and active conflicts.',
      'Review the active academic term in the header card.',
      'Use the quick action buttons to navigate directly to common tasks like scheduling, importing, and settings.'
    ],
    links: [
      { label: 'Schedule Builder', path: '/schedule' },
      { label: 'Audit Log', path: '/audit' }
    ]
  },
  '/schedule': {
    title: 'Schedule Builder',
    purpose: 'Build and manage class schedules, resolve room/teacher conflicts, and publish finalized schedules.',
    steps: [
      'Filter schedules by status (Draft vs Published) or search for specific subjects, rooms, or teachers.',
      'Click "+ New Entry" to schedule a class. Select the room, teacher, section, subject, and days/time.',
      'Review conflict warnings: red indicators mean HARD conflicts (cannot save), orange means SOFT warnings (can save but discouraged).',
      'Publish a schedule when it is finalized to lock it in and make it official.'
    ],
    links: [
      { label: 'Manage Rooms', path: '/rooms' },
      { label: 'Manage Sections', path: '/sections' },
      { label: 'Academic Years', path: '/academic-years' }
    ]
  },
  '/exams': {
    title: 'Exam Schedule',
    purpose: 'Schedule midterm, final, or departmental exams for active classes and export the exam calendar.',
    steps: [
      'Filter the exam schedule list by section, room, or exam type.',
      'Click "+ New Exam Entry" to schedule an exam, choosing the subject, date, time, and room.',
      'Check for conflicts with existing regular class schedules or other exams.',
      'Click "Export CSV" to download a spreadsheet of the exam schedule.'
    ],
    links: [
      { label: 'Schedule Builder', path: '/schedule' },
      { label: 'Calendar Events', path: '/calendar' }
    ]
  },
  '/rooms': {
    title: 'Rooms Management',
    purpose: 'Register and manage physical rooms, including their capacities, building locations, and department sharing scopes.',
    steps: [
      'Search rooms by code, name, building, or type.',
      'Click "+ New Room" to register a new room, set its building, floor, capacity, and department restriction (Shared vs. department-only).',
      'Use the "Template" and "Import File" buttons to bulk-load rooms using a CSV spreadsheet.',
      'Click on a room code in the table to view its detailed weekly schedule and utilization.'
    ],
    links: [
      { label: 'Schedule Builder', path: '/schedule' },
      { label: 'System Settings', path: '/settings' }
    ]
  },
  '/sections': {
    title: 'Sections Management',
    purpose: 'Manage class sections, year levels, department associations, and their academic term scopes.',
    steps: [
      'View all sections active in the current term.',
      'Click "+ New Section" to create a section, specifying the program, year level, and track/strand.',
      'Use the template and import buttons to upload multiple sections at once.',
      'Click on a section code in the list to view its weekly schedule grid.'
    ],
    links: [
      { label: 'Schedule Builder', path: '/schedule' },
      { label: 'Academic Years', path: '/academic-years' }
    ]
  },
  '/personnel': {
    title: 'Personnel Management',
    purpose: 'Manage teachers and staff, track weekly load limits, and assign department scopes.',
    steps: [
      'Search or filter personnel by name, department, or status.',
      'Click "+ New Personnel" to add a staff member with employee ID, name, email, and max weekly hours.',
      'Check if the staff member is shared across departments.',
      'Click on any staff member\'s name to view their individual load, teaching schedule, and detail page.'
    ],
    links: [
      { label: 'Schedule Builder', path: '/schedule' },
      { label: 'Manage Rooms', path: '/rooms' }
    ]
  },
  '/subject-bank': {
    title: 'Subject Bank',
    purpose: 'Store and manage subjects, units, hours, and department-level allocations.',
    steps: [
      'Filter subjects by department (e.g. Senior High School vs College).',
      'Click "+ New Subject" to register a course code, descriptive title, lecture/lab units, and hours.',
      'Ensure hours match course requirements, as the schedule builder validates scheduling times against these hours.'
    ],
    links: [
      { label: 'Schedule Builder', path: '/schedule' },
      { label: 'Manage Sections', path: '/sections' }
    ]
  },
  '/academic-years': {
    title: 'Academic Cycles',
    purpose: 'Configure academic cycles, set active terms, and manage semesters or quarters.',
    steps: [
      'Click "Add Academic Year" to setup a cycle, specifying the start date (the label and end date will auto-fill).',
      'Expand a row to add or edit semesters (1st/2nd/Summer) and define their date ranges.',
      'Mark a term as "Active" so that the rest of the application scopes schedules and sections to it.'
    ],
    links: [
      { label: 'Schedule Builder', path: '/schedule' },
      { label: 'Calendar Events', path: '/calendar' }
    ]
  },
  '/calendar': {
    title: 'Calendar Events',
    purpose: 'Track holidays, exam periods, institutional breaks, and custom events that impact class schedules.',
    steps: [
      'View calendar events in a chronological list.',
      'Click "+ New Event" to add a holiday, exam period, or break.',
      'Enable the "Blocks Scheduling" option if you want to prevent classes from being scheduled on that day.'
    ],
    links: [
      { label: 'Academic Years', path: '/academic-years' },
      { label: 'Exam Schedule', path: '/exams' }
    ]
  },
  '/templates': {
    title: 'Carry Forward (Templates)',
    purpose: 'Copy previous successful schedules to save time when starting a new term.',
    steps: [
      'View saved schedule templates.',
      'Save a current published schedule as a template.',
      'Apply a template to the active term. Note: Applying a template will run full conflict detection on the target term.'
    ],
    links: [
      { label: 'Schedule Builder', path: '/schedule' },
      { label: 'Academic Years', path: '/academic-years' }
    ]
  },
  '/import-templates': {
    title: 'Export Template',
    purpose: 'Download pre-formatted Excel templates for bulk data import.',
    steps: [
      'Click a template card to download the formatted Excel file.',
      'Open the file and fill in your data starting from Row 4.',
      'Required columns are highlighted in yellow with asterisks.',
      'Refer to the Instructions sheet for valid values and formatting.',
      'Upload the filled template via the Import File button on the relevant page.'
    ],
    links: [
      { label: 'Personnel', path: '/personnel' },
      { label: 'Sections', path: '/sections' },
      { label: 'Subject Bank', path: '/subject-bank' },
      { label: 'Rooms', path: '/rooms' }
    ]
  },
  '/audit': {
    title: 'Audit Log Trail',
    purpose: 'Trace system modifications chronologically, showing who made what change and when.',
    steps: [
      'Browse the list of actions (CREATE, UPDATE, ARCHIVE, RESTORE).',
      'Filter by user, action type, or entity type (e.g. room, section, schedule entry).',
      'Use the pagination at the bottom to browse older logs.'
    ],
    links: [
      { label: 'System Settings', path: '/settings' },
      { label: 'Trash Bin', path: '/trash' }
    ]
  },
  '/settings': {
    title: 'System Settings',
    purpose: 'Manage system profile settings, upload institution logo, change passwords, and create database backups.',
    steps: [
      'Update institution name, contact details, and footer text.',
      'Upload or replace the institutional logo (maximum 2MB size).',
      'Change the administrator password under the password section.',
      'Use "Backup Database" to save a copy of the database, or "Restore Backup" to load a previous copy.'
    ],
    links: [
      { label: 'Dashboard Overview', path: '/' },
      { label: 'Audit Log Trail', path: '/audit' }
    ]
  },
  '/trash': {
    title: 'Trash Bin',
    purpose: 'Restore accidentally archived records or permanently purge them from the database.',
    steps: [
      'View list of archived rooms, sections, personnel, subjects, templates, and events.',
      'Click "Restore" next to any item to return it to the active system.',
      'Click "Delete Permanently" to completely erase it (this action cannot be undone).'
    ],
    links: [
      { label: 'Dashboard Overview', path: '/' },
      { label: 'Audit Log Trail', path: '/audit' }
    ]
  }
}

// Route mapping helper that handles parameters/wildcards
export function getHelpContentForPath(path: string): HelpItem | null {
  // Normalize paths: strip query parameters or trailing IDs
  let normalizedPath = path.split('?')[0]
  
  // Handle detail views mapping back to parent list help
  if (normalizedPath.startsWith('/rooms/')) {
    normalizedPath = '/rooms'
  } else if (normalizedPath.startsWith('/sections/')) {
    normalizedPath = '/sections'
  } else if (normalizedPath.startsWith('/personnel/')) {
    normalizedPath = '/personnel'
  } else if (normalizedPath.startsWith('/academic-years/')) {
    normalizedPath = '/academic-years'
  }

  return HELP_CONTENT[normalizedPath] || null
}
