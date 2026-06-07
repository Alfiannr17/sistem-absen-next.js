import type { SVGProps } from 'react'

export type IconName =
  | 'activity'
  | 'arrow'
  | 'book'
  | 'calendar'
  | 'check'
  | 'clock'
  | 'copy'
  | 'dashboard'
  | 'download'
  | 'logout'
  | 'menu'
  | 'people'
  | 'profile'
  | 'search'
  | 'spark'
  | 'trend'
  | 'x'

const paths: Record<IconName, React.ReactNode> = {
  activity: <><path d="M4 13h3l2-7 4 12 2-7h5" /></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  book: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v16H7.5A2.5 2.5 0 0 0 5 20.5V4.5Z" /><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H20M9 6h7M9 10h7" /></>,
  calendar: <><path d="M7 3v3M17 3v3M4 9h16" /><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 13h3M8 17h2M14 13h2M14 17h2" /></>,
  check: <><path d="M20 11.1V12a8 8 0 1 1-4.7-7.3" /><path d="m20 4-9 9-3-3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>,
  dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" /></>,
  logout: <><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M9 12h9" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  people: <><path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11a4 4 0 0 1 4 4v2M16 3.1a4 4 0 0 1 0 7.8" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  spark: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 3l.8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8L5 3Z" /></>,
  trend: <><path d="M4 17 10 11l4 4 6-8" /><path d="M15 7h5v5" /></>,
  x: <><path d="m6 6 12 12M18 6 6 18" /></>,
}

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}

export function BrandMark({ tone = 'blue' }: { tone?: 'blue' | 'emerald' }) {
  const color = tone === 'emerald' ? 'from-emerald-500 to-teal-600' : 'from-blue-600 to-indigo-600'
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white`}>
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m3 8.5 9-5 9 5-9 5-9-5Z" />
        <path d="M7 11v4c0 2 2.2 3.5 5 3.5s5-1.5 5-3.5v-4M21 9v6" />
      </svg>
    </span>
  )
}
