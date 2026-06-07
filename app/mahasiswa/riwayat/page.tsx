'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatDate, formatDateTime, one, statusLabel, type AttendanceRecord, type ClassRecord, type MeetingRecord } from '@/utils/attendance'
import { EmptyState, LoadingState, PageHeader, StatCard } from '@/app/components/ui'

type AttendanceWithRelations = AttendanceRecord & {
  classes: ClassRecord | ClassRecord[] | null
  meetings: MeetingRecord | MeetingRecord[] | null
}

export default function MahasiswaRiwayatPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'semua' | 'present' | 'late'>('semua')
  const [history, setHistory] = useState<AttendanceWithRelations[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const { data } = await supabase.from('attendance').select('*, classes (*), meetings (*)').eq('student_id', user.id).order('attended_at', { ascending: false })
      setHistory((data ?? []) as AttendanceWithRelations[])
      setLoading(false)
    }
    run()
  }, [router, supabase])

  const visible = history.filter((item) => filter === 'semua' || item.status === filter)
  const attendanceRate = useMemo(() => history.length ? Math.round((history.filter((item) => item.status === 'present').length / history.length) * 100) : 0, [history])

  if (loading) return <LoadingState label="Memuat riwayat kehadiran..." />

  return (
    <div className="mx-auto w-full max-w-8xl px-4 py-8 sm:px-6">
      
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:p-7">
          <div><h2 className="text-xl font-bold text-slate-950">Semua catatan</h2><p className="mt-1 text-sm font-medium text-slate-500">{visible.length} catatan ditampilkan</p></div>
          <div className="flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(['semua', 'present', 'late'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${filter === item ? 'bg-white text-emerald-700' : 'text-slate-500'}`}>{item === 'present' ? 'Hadir' : item === 'late' ? 'Terlambat' : 'Semua'}</button>)}
          </div>
        </div>
        {visible.length ? (
          <>
            <div className="grid gap-3 p-4 xl:hidden">
              {visible.map((item) => {
                const kelas = one(item.classes)
                const meeting = one(item.meetings)
                return (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{kelas?.course_name ?? 'Kelas'}</h3><p className="mt-1 text-xs font-bold text-emerald-700">{kelas?.code ?? '-'}</p></div>
                      <span className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${item.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{statusLabel(item.status)}</span>
                    </div>
                    <dl className="mt-4 grid gap-3 border-t border-slate-200 pt-3 text-sm sm:grid-cols-3">
                      <div><dt className="text-slate-500">Pertemuan</dt><dd className="mt-1 font-bold text-slate-700">{meeting?.title ?? '-'}</dd></div>
                      <div><dt className="text-slate-500">Tanggal</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(item.attendance_date)}</dd></div>
                      <div><dt className="text-slate-500">Waktu absen</dt><dd className="mt-1 font-medium text-slate-700">{formatDateTime(item.attended_at)}</dd></div>
                    </dl>
                  </article>
                )
              })}
            </div>
            <div className="hidden xl:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-400"><tr><th className="px-6 py-4">Mata kuliah</th><th className="px-4 py-4">Pertemuan</th><th className="px-4 py-4">Tanggal</th><th className="px-4 py-4">Waktu absen</th><th className="px-6 py-4 text-right">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((item) => {
                  const kelas = one(item.classes)
                  const meeting = one(item.meetings)
                  return <tr key={item.id} className="transition hover:bg-slate-50/70"><td className="px-6 py-5"><p className="font-bold text-slate-900">{kelas?.course_name ?? 'Kelas'}</p><p className="mt-1 text-xs font-bold text-emerald-700">{kelas?.code ?? '-'}</p></td><td className="px-4 py-5 font-bold text-slate-700">{meeting?.title ?? '-'}</td><td className="px-4 py-5 font-semibold text-slate-500">{formatDate(item.attendance_date)}</td><td className="px-4 py-5 font-semibold text-slate-500">{formatDateTime(item.attended_at)}</td><td className="px-6 py-5 text-right"><span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${item.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{statusLabel(item.status)}</span></td></tr>
                })}
              </tbody>
            </table>
            </div>
          </>
        ) : <div className="p-6"><EmptyState icon="activity" title="Belum ada catatan" description="Riwayat akan muncul setelah Anda melakukan absensi di kelas." /></div>}
      </section>
    </div>
  )
}
