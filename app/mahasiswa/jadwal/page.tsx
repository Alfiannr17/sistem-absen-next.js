'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatClock, formatDate, localDateValue, one, type ClassRecord, type EnrollmentRecord, type MeetingRecord } from '@/utils/attendance'
import { Icon } from '@/app/components/icons'
import { EmptyState, LoadingState, PageHeader, StatCard } from '@/app/components/ui'

type EnrollmentWithClass = EnrollmentRecord & { classes: ClassRecord | ClassRecord[] | null }

export default function MahasiswaJadwalPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const today = localDateValue()

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const { data } = await supabase.from('enrollments').select('id, class_id, student_id, classes (*)').eq('student_id', user.id)
      const rows = (data ?? []) as EnrollmentWithClass[]
      setEnrollments(rows)
      const ids = rows.map((item) => item.class_id)
      if (ids.length) {
        const { data: meetingData } = await supabase.from('meetings').select('*').in('class_id', ids).gte('meeting_date', today).order('meeting_date', { ascending: true }).order('attendance_start', { ascending: true })
        setMeetings((meetingData ?? []) as MeetingRecord[])
      }
      setLoading(false)
    }
    run()
  }, [router, supabase, today])

  const classMap = useMemo(() => new Map(enrollments.map((item) => [item.class_id, one(item.classes)])), [enrollments])
  const todayMeetings = meetings.filter((item) => item.meeting_date === today)

  if (loading) return <LoadingState label="Menyusun jadwal kuliah..." />

  return (
    <div className="mx-auto w-full max-w-8xl px-4 py-8 sm:px-6">
    
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="mb-6"><h2 className="text-xl font-bold text-slate-950">Pertemuan mendatang</h2><p className="mt-1 text-sm font-medium text-slate-500">Termasuk agenda hari ini dan tanggal berikutnya.</p></div>
        {meetings.length ? (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const kelas = classMap.get(meeting.class_id)
              return (
                <Link href={`/mahasiswa/kelas/${meeting.class_id}`} key={meeting.id} className={`group flex flex-col gap-4 rounded-xl border p-4 transition sm:flex-row sm:items-center sm:p-5 ${meeting.is_active ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50' : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'}`}>
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${meeting.is_active ? 'border-emerald-200 bg-white text-emerald-700' : 'border-slate-200 bg-slate-50 text-blue-600'}`}><Icon name={meeting.is_active ? 'activity' : 'calendar'} className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{meeting.title}</h3>{meeting.is_active && <span className="rounded-xl bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">ABSEN AKTIF</span>}</div><p className="mt-1 truncate text-sm font-semibold text-slate-500">{kelas?.course_name ?? 'Kelas'} - {formatDate(meeting.meeting_date)}</p></div>
                  <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600"><Icon name="clock" className="h-4 w-4 text-emerald-600" />{formatClock(meeting.attendance_start)} - {formatClock(meeting.attendance_end)}</div>
                  <Icon name="arrow" className="hidden h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600 sm:block" />
                </Link>
              )
            })}
          </div>
        ) : <EmptyState icon="calendar" title="Tidak ada jadwal mendatang" description="Jadwal akan muncul setelah dosen membuat pertemuan baru." />}
      </section>
    </div>
  )
}
