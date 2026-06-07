import { Icon, type IconName } from './icons'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <header className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="text-xs font-bold text-blue-600">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">{title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500 sm:text-base">{description}</p>
        </div>
        {action}
      </div>
    </header>
  )
}

export function StatCard({ label, value, note, icon, tone = 'blue' }: { label: string; value: string | number; note?: string; icon: IconName; tone?: 'blue' | 'emerald' | 'amber' | 'violet' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
  }
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          {note && <p className="mt-1 text-xs font-semibold text-slate-400">{note}</p>}
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone]}`}><Icon name={icon} className="h-5 w-5" /></span>
      </div>
    </article>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block w-full sm:max-w-sm">
      <span className="sr-only">Cari</span>
      <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100" />
    </label>
  )
}

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center p-6">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        {label}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400"><Icon name={icon} className="h-7 w-7" /></span>
      <h3 className="mt-4 text-base font-bold text-slate-800">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm font-medium leading-6 text-slate-500">{description}</p>
    </div>
  )
}

export function Notice({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'red' | 'green' }) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
  return <p className={`rounded-xl border px-4 py-3 text-sm font-bold ${tones[tone]}`} aria-live="polite">{children}</p>
}
