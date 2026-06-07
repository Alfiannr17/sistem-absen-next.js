'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatClock, formatDate, localDateValue, type ClassRecord, type MeetingRecord } from '@/utils/attendance'
import { Icon } from '@/app/components/icons'
import { EmptyState, LoadingState, PageHeader, StatCard } from '@/app/components/ui'

export default function DosenJadwalPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'semua' | 'mendatang' | 'aktif'>('semua')
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const today = localDateValue()

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const { data: classData } = await supabase.from('classes').select('*').eq('teacher_id', user.id)
      const classRows = (classData ?? []) as ClassRecord[]
      setClasses(classRows)
      const ids = classRows.map((item) => item.id)
      if (ids.length) {
        const { data } = await supabase.from('meetings').select('*').in('class_id', ids).order('meeting_date', { ascending: true }).order('attendance_start', { ascending: true })
        setMeetings((data ?? []) as MeetingRecord[])
      }
      setLoading(false)
    }
    run()
  }, [router, supabase])

  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes])
  const visible = meetings.filter((item) => filter === 'semua' || (filter === 'aktif' ? item.is_active : item.meeting_date >= today))
  const upcoming = meetings.filter((item) => item.meeting_date >= today).length

  if (loading) return <LoadingState label="Menyusun jadwal pertemuan..." />

  return (
    <div className="mx-auto max-w-8xl space-y-6 px-6 py-8 sm:px-7 lg:px-6 lg:py-8">
      
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-slate-950">Agenda pertemuan</h2><p className="mt-1 text-sm font-medium text-slate-500">Urut berdasarkan tanggal dan jam</p></div>
          <div className="flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(['semua', 'mendatang', 'aktif'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${filter === item ? 'bg-white text-blue-600' : 'text-slate-500'}`}>{item}</button>)}
          </div>
        </div>
        {visible.length ? (
          <div className="space-y-3">
            {visible.map((meeting) => {
              const kelas = classMap.get(meeting.class_id)
              return (
                <Link key={meeting.id} href={`/dosen/kelas/${meeting.class_id}`} className="group flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:p-5">
                  <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border ${meeting.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    <span className="text-[9px] font-bold">{new Date(`${meeting.meeting_date}T00:00:00`).toLocaleDateString('id-ID', { month: 'short' })}</span>
                    <span className="text-xl font-bold">{meeting.meeting_date.slice(-2)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{meeting.title}</h3>{meeting.is_active && <span className="rounded-xl bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">AKTIF</span>}</div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-500">{kelas?.course_name ?? 'Kelas'} - {formatDate(meeting.meeting_date)}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"><Icon name="clock" className="h-4 w-4 text-blue-600" />{formatClock(meeting.attendance_start)} - {formatClock(meeting.attendance_end)}</div>
                  <Icon name="arrow" className="hidden h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600 sm:block" />
                </Link>
              )
            })}
          </div>
        ) : <EmptyState icon="calendar" title="Belum ada agenda" description="Buat pertemuan dari halaman detail kelas agar jadwal muncul di sini." />}
      </section>
    </div>
  )
}
