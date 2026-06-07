'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatClock, one, statusLabel, type AttendanceRecord, type ClassRecord, type EnrollmentRecord, type MeetingRecord } from '@/utils/attendance'
import { Icon } from '@/app/components/icons'
import { EmptyState, LoadingState, PageHeader, SearchBox, StatCard } from '@/app/components/ui'

type EnrollmentWithClass = EnrollmentRecord & { classes: ClassRecord | ClassRecord[] | null }

export default function MahasiswaKelasPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const { data } = await supabase.from('enrollments').select('id, class_id, student_id, created_at, classes (*)').eq('student_id', user.id).order('created_at', { ascending: false })
      const rows = (data ?? []) as EnrollmentWithClass[]
      setEnrollments(rows)
      const ids = rows.map((item) => item.class_id)
      if (ids.length) {
        const [{ data: meetingData }, { data: attendanceData }] = await Promise.all([
          supabase.from('meetings').select('*').in('class_id', ids).eq('is_active', true),
          supabase.from('attendance').select('*').eq('student_id', user.id).in('class_id', ids),
        ])
        setMeetings((meetingData ?? []) as MeetingRecord[])
        setAttendance((attendanceData ?? []) as AttendanceRecord[])
      }
      setLoading(false)
    }
    run()
  }, [router, supabase])

  const activeByClass = useMemo(() => new Map(meetings.map((item) => [item.class_id, item])), [meetings])
  const attendanceByMeeting = useMemo(() => new Map(attendance.map((item) => [item.meeting_id, item])), [attendance])
  const filtered = enrollments.filter((item) => {
    const kelas = one(item.classes)
    return `${kelas?.course_name ?? ''} ${kelas?.code ?? ''}`.toLowerCase().includes(search.toLowerCase())
  })

  if (loading) return <LoadingState label="Memuat kelas mahasiswa..." />

  return (
    <div className="mx-auto w-full max-w-8xl px-4 py-8 sm:px-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><h2 className="text-xl font-bold text-slate-950">Semua kelas</h2><p className="mt-1 text-sm font-medium text-slate-500">{filtered.length} kelas ditemukan</p></div>
          <SearchBox value={search} onChange={setSearch} placeholder="Cari kelas..." />
        </div>
        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const kelas = one(item.classes)
              const active = activeByClass.get(item.class_id)
              const record = active ? attendanceByMeeting.get(active.id) : null
              return (
                <article key={item.id} className="group rounded-xl border border-slate-200 p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/20">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700"><Icon name="book" className="h-5 w-5" /></span>
                    <span className={`rounded-xl px-3 py-1 text-[11px] font-bold ${record?.status === 'present' ? 'bg-emerald-100 text-emerald-700' : record?.status === 'late' ? 'bg-amber-100 text-amber-700' : active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{active ? statusLabel(record?.status) : 'Standby'}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{kelas?.course_name ?? 'Kelas'}</h3>
                  <p className="mt-1 text-sm font-bold text-emerald-700">{kelas?.code ?? '-'}</p>
                  <div className="mt-5 min-h-20 rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-bold text-slate-400">Sesi aktif</p>
                    <p className="mt-1 truncate text-sm font-bold text-slate-800">{active?.title ?? 'Belum ada sesi aktif'}</p>
                    {active && <p className="mt-1 text-xs font-bold text-emerald-700">{formatClock(active.attendance_start)} - {formatClock(active.attendance_end)}</p>}
                  </div>
                  <Link href={`/mahasiswa/kelas/${item.class_id}`} className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition group-hover:bg-emerald-600">Buka kelas <Icon name="arrow" className="h-4 w-4" /></Link>
                </article>
              )
            })}
          </div>
        ) : <EmptyState icon="book" title="Kelas belum ditemukan" description={search ? 'Coba gunakan kata kunci lain.' : 'Gabung ke kelas menggunakan kode dari dosen.'} />}
      </section>
    </div>
  )
}
